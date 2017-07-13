/*
	Map Module
*/

/* CELLS */
function Cell(grid, center, gridPosition) {
	this.grid = grid;
	this.gridPosition = gridPosition;
	this.center = center;
	this.state = CellState.EMPTY;
	this.object = null;
	this.staticObjects = [];
	this.style = [DefaultCellStyle]; //{edge: 'white', fill: 'black', width: 3};
	this.id = getRandomInt(10000000, 99999999);
	this.triggers = [];
	this.triggersCounter = 0;
}

Cell.prototype.Draw = function(onBack) {
	if(this.state === CellState.INVISIBLE)
		return;
	onBack = onBack ? onBack : true;
	this.grid.gm.render.DrawHex(this.center, this.grid.radius, this.style[this.style.length-1], onBack);
};

Cell.prototype.ClearStyle = function() {
	if(this.style.length <= 1)
		return;

	this.style.pop();
	this.Draw();
};

Cell.prototype.SetStyle = function(style, force) {
	if(force === true) {
		this.style.length = 0;
	}
	// else if(this.style[this.style.length-1] == style) {
	// 	this.ClearStyle();
	// 	return;
	// }

	this.style.push(style);
	this.Draw();
};

Cell.prototype.AddTrigger = function (trig) {
	trig.id = ++this.triggersCounter;
	this.triggers.push(trig);
};

Cell.prototype.ActivateTriggers = function (object, obj_only) {
	if(this.object)
		this.object.ActivateTriggers(object);
	if(obj_only) return;

	for(let i = 0; i < this.staticObjects.length; ++i)
		this.staticObjects[i].ActivateTriggers(object);

	for(let i = 0; i < this.triggers.length; ++i)
		this.triggers[i].Activate(object);
};

Cell.prototype.RemoveTrigger = function (id) {
	for (let i = 0; i < this.triggers.length; ++i)
		if (this.triggers[i] == id) {
			delete this.triggers[i];
			this.triggers.splice(i, 1);
			break;
		}
};

Cell.prototype.Clear = function (force) {
	delete this.object;
	this.object = null;
	this.staticObjects = [];
	if(force === true)
		this.style = [DefaultCellStyle];
	else
		this.style.length = 1;
	this.state = CellState.EMPTY;
	this.triggers = [];
	// this.style
};

Cell.prototype.Interact = function (cell, callback) {
	let result = 0;
	switch (this.state) {
		case CellState.INVISIBLE:
			callback(InteractResult.NOTHING);
		break;

		case CellState.EMPTY:
			this.ActivateTriggers(cell.object);
			callback(InteractResult.MOVED);
		break;

		default:
			cell.ActivateTriggers(cell.object, true);
			this.ActivateTriggers(cell.object);
			
			for(let i = 0; i < this.staticObjects.length; ++i)
				this.staticObjects[i].Collide(cell.object, function(res) { if(res > result) result = res; } );
			
			if(this.object)
				this.object.Collide(cell.object, function(res) { if(res > result) result = res; } );

			callback(result);
		break;
	}
};

Cell.prototype.MoveObject = function (object) {
	//if (!this.isEmpty()) return undefined;

	this.object = object;
	this.state = CellState.OBJECT;

	return this.object;
};

Cell.prototype.AddObject = function (objectFunc) {
	if (!this.isEmpty()) return undefined;

	let obj = objectFunc();
	if(obj.GetType() >= GameObjectTypes.DYNAMIC)
		this.object = obj;
	else
		this.staticObjects.push(obj);
	this.state = CellState.OBJECT;

	return obj;
};

Cell.prototype.isEmpty = function () {
	return (this.state === CellState.EMPTY);
};

Cell.prototype.GetNearby = function () {
	let pos, nearby = [];
	for (let i = 0; i < HexDirections.length; ++i) {
		pos = this.grid.PixelToHex(this.center.x, this.center.y);
		pos.x += HexDirections[i][0], pos.y += HexDirections[i][1];

		if(pos.x < 0 || pos.y < 0 || pos.x >= this.size || pos.y >= this.size
		|| this.grid.map[pos.y][pos.x].state != CellState.EMPTY) continue;

		nearby.push(this.grid.map[pos.y][pos.x]);
	}
	return nearby;
};

Cell.prototype.FillNearby = function(style) {
	let nearby = this.GetNearby();
	for(let i = 0; i < nearby.length; ++i) {
		nearby[i].SetStyle(style);
	}
};

Cell.prototype.ClearNearby = function() {
	let nearby = this.GetNearby();
	for(let i = 0; i < nearby.length; ++i)
		nearby[i].ClearStyle();
};

Cell.prototype.isNearbyXY = function (pos1, pos2) {
	let x = pos1.x - pos2.x;
	let y = pos1.y - pos2.y;

	return (Math.abs(x) <= 1 && Math.abs(y) <= 1 && x !== y);
};

Cell.prototype.isNearby = function (cell) {
	let pos1 = this.grid.PixelToHex(this.center.x, this.center.y);
	let pos2 = this.grid.PixelToHex(cell.center.x, cell.center.y);

	return this.isNearbyXY(pos1, pos2);
};
/*Need to test correctness of map[curr.y][curr.x]*/
Cell.prototype.GetRing = function (radius) {
	let HexDir = HexDirections;
	let pos = this.position();
	let ring = [];
	let curr = {x: 0, y: 0};
	for (let i = 0; i < HexDir.length; ++i) {
		for (let j = 0; j < radius; ++j) {
			curr.x = pos.x + radius * HexDir[i][0] + j * HexDir[(i + 1) % HexDir.length][0];
			curr.y = pos.y + radius * HexDir[i][1] + j * HexDir[(i + 1) % HexDir.length][1];
			ring.push(this.grid.map[curr.y][curr.x]);
		}
	}
	return ring;
};

Cell.prototype.ShortestWay = function (cell) {

};

/* GRID */
function Grid(offset_X, offset_Y, size, radius) {
	this.radius = radius;
	this.offset_x = 0;
	this.offset_y = 0;
	this.shift_x  = 0;
	this.shift_y  = 0;
	
	this.size = 0;
	this.map = [];

	this.Calculate(size);
	this.GenerateGrid(size);
}
Grid.prototype = Object.create(BaseModel.prototype);

Grid.prototype.Calculate = function(size) {
	// if(this.gm.render.start_width > this.gm.render.start_height)
	// 	this.radius = Math.floor(0.95 * this.gm.render.start_height / (1.5 * size + size % 2));
	// else
	// 	this.radius = Math.floor(0.95 * this.gm.render.start_width / (Math.sqrt(3) * (1.5 * size - 0.5)));
	// this.gm.render.SetScale((this.gm.render.start_height / this.radius) / (size - 1));

	// this.offset_x = Math.floor(this.gm.render.start_width * 0.1);
	this.offset_x = Math.floor(this.gm.render.GetCanvas().width * 0.05);
	this.offset_y = Math.floor(this.gm.render.GetCanvas().height * 0.1);

	this.shift_x = this.radius * Math.cos(Math.PI / 180 * 30);
	this.shift_y = this.radius * Math.sin(Math.PI / 180 * 30);
}

Grid.prototype.GenerateGrid = function(size) {
	if(this.size == size) return;

	// this.radius *= this.gm.render.scale;
	// if(this.size > 0)
	// 	this.gm.render.SetScale((this.gm.render.start_height / (2 * this.radius)) / size, true);
	// 	this.gm.render.SetScale(this.size / size * 0.9, true);
		// this.Calculate(size / this.size, true);

	let hide = (this.size > size);
	if(!hide) {
		let foo = this.size;
		this.size = size;
		size = foo;
	}	

	if(size > 0) {
		this.gm.render.SetSize(size * 2 * this.shift_x + (size-1) * this.shift_x + this.offset_x,
							   size * this.radius + size * this.shift_y + this.offset_y);
	}

	let x = 0, y = 0;
	for(let i = 0; i < this.size; ++i) {
		if(i < size) {
			for(let j = size; j < this.size; ++j) {
				if(hide) {
					this.map[i][j].state = CellState.INVISIBLE;
				} else {
					x = this.offset_x + this.shift_x * j * 2 + i * this.shift_x;
					y = this.offset_y + this.shift_y * i * 3;
					this.map[i][j] = new Cell(this, new Point(x, y), new Point(j, i));
				}
			} 
		} else {
			if(!hide)
				this.map[i] = [];
			for(let j = 0; j < this.size; ++j) {
				if(hide) {
					this.map[i][j].state = CellState.INVISIBLE;
				} else {
					x = this.offset_x + this.shift_x * j * 2 + i * this.shift_x;
					y = this.offset_y + this.shift_y * i * 3;
					this.map[i][j] = new Cell(this, new Point(x, y), new Point(j, i));
				}
			}
		}
	}

	if(!hide)
		this.bounds = new Rect(this.offset_x - this.shift_x, this.offset_y - this.radius, x + this.shift_x, y + this.radius);
};

Grid.prototype.LoadLevel = function(level) {
	this.Clear();
	this.GenerateGrid(level.size);

	for(let i = 0; i < level.map.length; ++i) {
	    if (level.map[i][0] === LevelObjects.INVISIBLE){
            this.map[level.map[i][1]][level.map[i][2]].state = CellState.INVISIBLE;
            continue;
        } else if (level.map[i][0] === LevelObjects.STYLE){
            this.map[level.map[i][1]][level.map[i][2]].SetStyle(level.map[i][3][0], true);
            continue;
        }
		let cell = this.map[level.map[i][1]][level.map[i][2]];
		this.gm.CreateObject(LevelObjFunc[level.map[i][0]], cell, level.map[i][3]);
	}

	if(level.triggers === undefined)
		return;

	for(let i = 0; i < level.triggers.length; ++i) {
		let cell = this.map[level.triggers[i][1]][level.triggers[i][2]];
		let trig = new Trigger(cell, level.triggers[i][0][0],
								     level.triggers[i][0][1],
								     level.triggers[i][0][2],
            						 level.triggers[i][0][3]);
		cell.AddTrigger(trig);
	}

	this.Draw();
};

Grid.prototype.Draw = function(onBack) {
	for(let i = 0; i < this.size; ++i)
		for(let j = 0; j < this.size; ++j)
			this.map[i][j].Draw(onBack);
};

Grid.prototype.Clear = function () {
	this.gm.render.Clear();
	this.gm.render.ClearBack();
	for (let i = 0; i < this.size; ++i)
		for (let j = 0; j < this.size; ++j)
			this.map[i][j].Clear(true);
	this.gm.ClearObjects();
};

Grid.prototype.PixelToHex = function (x, y) {
	point = new Point(x, y);

	y -= this.offset_y - this.radius;
	let sy = Math.floor(y / this.shift_y / 3);
	x -= this.offset_x + this.shift_x * sy - this.shift_x;
	let sx = Math.floor(x / this.shift_x / 2);

	if(sx < 0 || sy < 0 || sx >= this.size || sy >= this.size) return undefined;

	let c = this.map[sy][sx].center;
	let x1 = c.x - this.shift_x;
	let x2 = c.x + this.shift_x;
	let y1 = c.y - this.shift_y;
	let y2 = c.y - this.radius;

	if(point.isInTriangle(new Point(c.x, y2), new Point(x1, y1), new Point(x1, y2))) {
		sy--;
		if(sy < 0) return undefined;
	}
	else if(point.isInTriangle(new Point(c.x, y2), new Point(x2, y1), new Point(x2, y2))) {
		sy--;
		sx++;
		if(sy < 0 || sx >= this.size) return undefined;
	}
	return new Point(sx, sy);
};

Grid.prototype.Select = function (x, y) {
	let pos = this.PixelToHex(x, y);
	if (pos === undefined) return;

    console.log('CLICKED', this.gm.gameState)
	if (this.gm.gameState == GameState.TURN)
		this.gm.GridClicked(pos);
	// this.map[pos.y][pos.x].style = {edge: 'black', fill: '#1F282D', width: 1};
	// this.map[pos.y][pos.x].Draw();
};

/* Path Class */
function Path(cells = []) {
	this.points = cells;
	this.current = 0;
}

Path.prototype.NextTurn = function () {
	return this.points[(++this.current) % this.points.length];
};

Path.prototype.PrevTurn = function () {
	return this.points[(this.current - 1 + this.points.length) % this.points.length];
};

Path.prototype.PushTurn = function (cell) {
	if (this.isCorrect(cell))
		this.points.push(cell);
};

Path.prototype.ClearPath = function () {
	this.points = [];
	this.current = 0;
};

Path.prototype.isCorrect = function(cell) {
	return (this.points[this.current].isNearby(cell));
};

Path.prototype.isEmpty = function () {
	return (this.points.length === 0);
};