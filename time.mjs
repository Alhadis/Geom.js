export default class Time extends Number {
	static SECOND = 1000;
	static MINUTE = 60000;
	static HOUR   = 3600000;

	constructor(input){
		input = input instanceof Date
			? [
				input.getUTCSeconds() + input.getUTCMilliseconds(),
				input.getUTCMinutes(),
				input.getUTCHours(),
			]
			: `${input}`
				.replaceAll(",", ".")
				.replaceAll(";", ":")
				.split(":")
				.reverse()
				.map(parseFloat);
		const [sec = 0, min = 0, hrs = 0] = input;
		super((sec * Time.SECOND) + (min * Time.MINUTE) + (hrs * Time.HOUR));
	}

	toString(){
		let hours   = 0;
		let minutes = 0;
		let seconds = 0;
		let ms      = 0;
		let value   = +this;

		if(value >= Time.HOUR)
			hours = Math.floor(value / Time.HOUR),
			value %= Time.HOUR;
		if(value >= Time.MINUTE)
			minutes = Math.floor(value / Time.MINUTE),
			value %= Time.MINUTE;
		if(value >= Time.SECOND)
			seconds = Math.floor(value / Time.SECOND),
			value %= Time.SECOND;
		ms = value;

		return (
			`${hours}`  .padStart(2, "0") + ":" +
			`${minutes}`.padStart(2, "0") + ":" +
			`${seconds}`.padStart(2, "0") + "." +
			`${ms}`     .padStart(3, "0")
		);
	}
}

Object.defineProperties(Time, {
	SECOND: {writable: false, configurable: false},
	MINUTE: {writable: false, configurable: false},
	HOUR:   {writable: false, configurable: false},
});
