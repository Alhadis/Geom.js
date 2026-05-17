import Shape from "./shape.mjs";
import Point from "./point.mjs";

/**
 * A two-dimensional rectangle.
 * @class
 */
export default class Rect extends Shape{
	constructor(x = 0, y = 0, width = 0, height = width){
		if(x instanceof Rect)
			return Rect;
		
		super([
			new Point(x, y),
			new Point(x + width, y),
			new Point(x + width, y + height),
			new Point(x, y + height),
		], true);
	}
}
