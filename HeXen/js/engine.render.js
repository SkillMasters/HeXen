/*
	All Draw Events and functions
*/

function Point(x, y) {
	this.x = x;
	this.y = y;
}

Point.prototype.Distance = function(point) {
	return Math.sqrt( Math.pow((this.x - point.x), 2) + Math.pow((this.y - point.y), 2) );
}

Point.prototype.GetVector = function(point) {
	return new Point(point.x - this.x, point.y - this.y);
}


function Rect(x, y, w, h) {
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
}

Rect.prototype.isInArea = function (x, y) {
	if (this.x < x && x < (this.x + this.w) &&
		this.y < y && y < (this.y + this.h))
		return true;
	else
		return false;
}


function Drawable(scale) {
	if(scale === undefined) scale = 1;
	this.scale = scale;
}

function Sprite(image, scale) {
	Drawable.call(this, scale);
	this.img = image;
}
Sprite.prototype = Object.create(Drawable.prototype);

Sprite.prototype.Draw = function(x, y, onBack) {
	this.gm.render.DrawSprite(this.img, x, y, this.scale, onBack);
}

function Animation(frames_img, frames_count, offsetX, offsetY, width, height, speed) {
	this.frames_img = frames_img;
	this.frames_count = frames_count;
	this.offset_x = offsetX;
	this.offset_y = offsetY;
	this.w = width;
	this.h = height;
	this.cur_frame = 0;
	this.speed = speed;
	this.interval = null;
	this.isPlayed = false;
}
Animation.prototype = Object.create(Drawable.prototype);

Animation.prototype.Draw = function (x, y, scale, onBack) {
	this.cur_frame++;
	if (this.cur_frame >= this.frames_count)
		this.cur_frame = 0;
	this.gm.render.DrawFrame(this, x, y, scale, onBack);
}

Animation.prototype.Play = function () {
	this.isPlayed = true;
	this.interval = setInterval(this.UpdateFrame.bind(this), this.speed * 1000);
}

Animation.prototype.Stop = function () {
	if (!this.isPlayed)
		return;
	this.isPlayed = false;
	clearInterval(this.interval);
}

function Animator() {
	this.motion = [];
}
Animator.prototype = Object.create(Drawable.prototype);

Animator.prototype.AddMotion = function(start, end, speed) {
	console.log(start, end);
	this.motion.push([speed, start, end]);
}

Animator.prototype.ProcessMotions = function(dTime) {
	let dir;
	for(let i = 0; i < this.motion.length; ++i) {
		dir = this.motion[i][1].GetVector(this.motion[i][2]);
		this.motion[i][1].x += dir.x * dTime / 1000 * this.motion[i][0];
		this.motion[i][1].y += dir.y * dTime / 1000 * this.motion[i][0];

		if(this.motion[i][1].Distance(this.motion[i][2]) < this.motion[i][0] / 5) {
			this.motion[i][1].x = this.motion[i][2].x;
			this.motion[i][1].y = this.motion[i][2].y;
			this.motion.splice(i, 1);
			i--;
		}
	}
	if(this.motion.length == 0 && this.gm.gameState === GameState.ANIMATING) {
		this.gm.gameState = GameState.TURN;
	}
}


function Render() {
	this.lastRender = 0;

	this.fgcanvas = document.getElementById('game');
	this.fgcanvas.width = window.innerWidth;// window.outerWidth;
	this.fgcanvas.height = window.innerHeight;
	this.cnt_fg = this.fgcanvas.getContext('2d');
	// this.cnt_fg.fillStyle = 'rgba(0, 255, 0, 0.3)';

	this.bgcanvas = document.createElement('canvas');
	this.bgcanvas.id = 'field';
	this.bgcanvas.width = window.innerWidth;
	this.bgcanvas.height = window.innerHeight;
	this.cnt_bg = this.bgcanvas.getContext('2d');
	document.body.appendChild(this.bgcanvas);
}

Render.prototype.Clear = function() {
	this.cnt_fg.clearRect(0, 0, this.fgcanvas.width, this.fgcanvas.height);
}

Render.prototype.ClearBack = function() {
	this.cnt_bg.clearRect(0, 0, this.bgcanvas.width, this.bgcanvas.height);
}

Render.prototype.GetCanvas = function() {
	return this.fgcanvas;
}

Render.prototype.deltaTime = function() {
	let currentDate = new Date();
	let dTime = currentDate - this.lastRender;
	if(this.lastRender === 0) dTime = 0;
	this.lastRender = currentDate;
	return dTime;
}

Render.prototype.DrawPath = function(points, onBack, effect) {
	if(points.length <= 1)
		return;
	let context = (onBack === true ? this.cnt_bg : this.cnt_fg);

	context.beginPath();
	context.moveTo(Math.floor(points[0].x), Math.floor(points[0].y));
	for(let i = 1; i < points.length; ++i) {
		context.lineTo(Math.floor(points[i].x), Math.floor(points[i].y));
	}
	context.closePath();

	context.lineWidth = (effect.width !== undefined ? effect.width : 1);
	context.strokeStyle = (effect.edge !== undefined ? effect.edge : 'black');
	context.stroke();

	if(effect.fill !== undefined) {
		context.fillStyle = effect.fill;
		context.fill();
	}
}

Render.prototype.DrawHex = function(center, radius, onBack, effect) {
	let hexagon = [];
	for(let i = 0; i < 6; ++i) {
		let angle_deg = 60*i + 30;
		let angle_rad = Math.PI / 180 * angle_deg;
		hexagon.push({
						x: center.x + radius * Math.cos(angle_rad),
						y: center.y + radius * Math.sin(angle_rad)
					 });
	}
	this.DrawPath(hexagon, effect, onBack);
}

Render.prototype.DrawLine = function(point1, point2, onBack, effect) {
	this.DrawPath([point1, point2], effect, onBack);
}

Render.prototype.DrawCircle = function(center, radius, onBack, effect) {
	let context = (onBack === true ? this.cnt_bg : this.cnt_fg);

	context.beginPath();
	context.arc(center.x, center.y, radius, 0, 2 * Math.PI, false);

	context.lineWidth = (effect.width !== undefined ? effect.width : 1);
	context.strokeStyle = (effect.edge !== undefined ? effect.edge : 'black');
	context.stroke();

	if(effect.fill !== undefined) {
		context.fillStyle = effect.fill;
		context.fill();
	}
}

Render.prototype.DrawRectangle = function(rect, onBack, effect) {
	let context = (onBack === true ? this.cnt_bg : this.cnt_fg);

	context.beginPath();
	context.rect(rect.x, rect.y, rect.w, rect.h);

	context.lineWidth = (effect.width !== undefined ? effect.width : 1);
	context.strokeStyle = (effect.edge !== undefined ? effect.edge : 'black');
	context.stroke();

	if(effect.fill !== undefined) {
		context.fillStyle = effect.fill;
		context.fill();
	}
}

Render.prototype.DrawFrame = function (anim, x, y, scale, onBack) {
    let context = (onBack === true ? this.cnt_bg : this.cnt_fg);

    let dx = anim.offset_x + anim.cur_frame * anim.w;
    let count = Math.floor(dx / anim.frames_img.width);
    let sx = dx - anim.frames_img.width * count;
    let sy = anim.offset_y + count * anim.h;
    context.drawImage(anim.frames_img, sx, sy, anim.w, anim.h, x, y, anim.w * scale, anim.h * scale);
}

Render.prototype.DrawSprite = function (img, x, y, scale, onBack) {
    let context = (onBack === true ? this.cnt_bg : this.cnt_fg);

    context.drawImage(img, 0, 0, img.width, img.height, x, y, img.width * scale, img.height * scale);
}