/*
	Input Module
*/

function Mouse(gm) {
	this.gm = gm;
	this.posX = 0;
	this.posY = 0;
	this.isMoving = false;

	this.gm.event.AddEvent('mousemove', this.Move.bind(this), EventType.LISTEN);
	this.gm.event.AddEvent('mouseup',   this.Up.bind(this), EventType.LISTEN);
	this.gm.event.AddEvent('mousedown', this.Down.bind(this), EventType.LISTEN);
	this.gm.event.AddEvent('contextmenu', this.Select.bind(this), EventType.LISTEN);

	this.gm.event.AddEvent('touchmove', this.MoveTouch.bind(this), EventType.LISTEN);
	this.gm.event.AddEvent('touchend',  this.UpTouch.bind(this), EventType.LISTEN);
	this.gm.event.AddEvent('touchstart', this.DownTouch.bind(this), EventType.LISTEN);
}

Mouse.prototype.Move = function(event) {
	this.UpdateCoords(event);
};

Mouse.prototype.Up = function(event) {
	this.isMoving = false;
};

Mouse.prototype.Down = function(event) {
	if(event.which == 3) return;

	this.isMoving = true;
	this.UpdateCoords(event);
	this.gm.MouseEvent(event);
};

Mouse.prototype.Select = function(event) {
	event = event || window.event;
	event.preventDefault ? event.preventDefault() : (event.returnValue=false);

	this.isMoving = true;
	this.UpdateCoords(event);

	// let pos = this.gm.grid.PixelToHex(this.posX, this.posY);
	// let cell = this.gm.grid.map[pos.y][pos.x];

	// let path = this.gm.players[0].cell.ShortestWay(cell);
	// for(let i = 0; i < path.length; ++i)
	// 	path[i].SetStyle(TestStyle, true);
};

Mouse.prototype.MoveTouch = function(event) {
	this.UpdateCoordsTouch(event, true);
};

Mouse.prototype.UpTouch = function(event) {
	this.isMoving = false;
};

Mouse.prototype.DownTouch = function(event) {
	this.isMoving = true;
	this.UpdateCoords(event, true);
	this.gm.MouseEvent(event);
};


Mouse.prototype.UpdateCoords = function(event, isTouch) {
	let canvas = this.gm.render.GetCanvas();

	if(isTouch === true) {
		this.posX = event.changedTouches[0].pageX - canvas.offsetLeft;
		this.posY = event.changedTouches[0].pageY - canvas.offsetTop;
	}
	else {
		this.posX = event.pageX - canvas.offsetLeft;
		this.posY = event.pageY - canvas.offsetTop;
	}

	if(this.posX > canvas.width - ClickRadius) this.posX = canvas.width - ClickRadius;
	else if(this.posX < ClickRadius) this.posX = ClickRadius;

	if(this.posY > canvas.height - ClickRadius) this.posY = canvas.height - ClickRadius;
	else if(this.posY < ClickRadius) this.posY = ClickRadius;

	this.posX = Math.floor(this.posX / this.gm.render.scale);
	this.posY = Math.floor(this.posY / this.gm.render.scale);
};