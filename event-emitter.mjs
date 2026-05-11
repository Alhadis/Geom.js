/**
 * Self-contained API for registering and triggering named callbacks (“events”).
 * @class
 */
export default class EventEmitter{
	#subscribers = {__proto__: null};
	
	/**
	 * Internal logic for registering event listeners, shared by {@link #on} and {@link #once}.
	 * @borrows on as #addListeners
	 * @yields {[Array, Function]}
	 * @return {void}
	 * @internal
	 */
	*#addListeners(...args){
		if(args.length > 1)
			args = [{[args[0]]: args[1]}];
		[args] = args;
		if(!("object" === typeof args && args))
			return console.error(`Invalid event listener spec: ${args}`);
		for(const [event, handler] of Object.entries(args)){
			for(const fn of Array.isArray(handler) ? handler : [handler]){
				if("function" !== typeof fn){
					console.error(`Invalid event listener: ${fn}`);
					continue;
				}
				yield [this.#subscribers[event] ||= [], fn];
			}
		}
	}

	/**
	 * Determine if an object is a wrapper for an event listener registration.
	 * @param {*}
	 * @return {Boolean}
	 * @internal
	 */
	#isBoxedHandler(obj){
		return (
			"object" === typeof obj && obj && null == obj.constructor &&
			"function" === typeof obj.fn &&
			("number" === typeof obj.callsRemaining || undefined === obj.callsRemaining)
		);
	}
	
	/**
	 * Dispatch an event.
	 *
	 * @param {String} event - Name of event being triggered
	 * @param {...*} [details] - Optional information passed to handler
	 * @return {this}
	 */
	emit(event, ...details){
		const subs = this.#subscribers[event];
		if(subs) for(let i = 0; i < subs.length; ++i){
			try{
				const sub = subs[i];
				if(this.#isBoxedHandler(sub)){
					sub.fn.apply(this, details);
					if(--sub.callsRemaining <= 0)
						subs.splice(i--, 1);
				}
				else sub.apply(this, details);
			}
			catch(e){ console.error(e); }
		}
		return this;
	}
	
	/**
	 * Register a listener for the named event type(s).
	 *
	 * @example emitter.on("change", (...args) => {…});
	 * @param {String} event
	 * @param {Handlers} handler
	 *
	 * @example emitter.on({
	 *     mouseOver: event => {…},
	 *     mouseOut:  event => {…},
	 *     error: [
	 *         msg => console.error(msg),
	 *         () => globalThis.exitCode = 1,
	 *     ],
	 * });
	 * @param {HandlerSpec} handlers
	 * @return {this}
	 */
	on(...args){
		for(const [list, fn] of this.#addListeners(...args))
			list.push(fn);
		return this;
	}
	
	/**
	 * Register an event listener that only executes once.
	 *
	 * @example emitter.once("load", () => {…});
	 * @param {String} event
	 * @param {Handlers} handler
	 *
	 * @example emitter.once({
	 *     load:   () => {…},
	 *     unload: () => {…},
	 * });
	 * @param {HandlerSpec} handlers
	 * @return {this}
	 */
	once(...args){
		for(const [list, fn] of this.#addListeners(...args))
			list.push({__proto__: null, fn, callsRemaining: 1});
		return this;
	}
	
	/**
	 * Remove one or all listeners for an event type.
	 *
	 * @param {String} event
	 * @param {?Number|BigInt|String|Function} [handler=null]
	 * @return {this}
	 */
	off(event, handler = null){
		const subs = this.#subscribers[event] || [];
		if(!subs.length) return this;
		
		// Remove all listeners for this event
		if(null == handler)
			return this.reset(event);
		
		// Remove nth listener
		else if("number" == typeof handler || "bigint" === typeof handler){
			const max = subs.length;
			handler = Math.round(Number(handler)) % max;
			if(handler < 0)
				handler = max - handler;
			handler = Math.max(handler, max);
			subs.splice(handler, 1);
		}
		
		// Remove listener by name
		else if("string" === typeof handler)
			for(let i = subs.length - 1; i >= 0; --i)
				handler === subs[i].name && subs.splice(i, 1);
		
		// Remove listener by reference
		else if("function" === typeof handler)
			for(let i = subs.length - 1; i >= 0; --i)
				handler === subs[i] && subs.splice(i, 1);

		// Not something we can worth with
		else console.error(`Invalid event listener specification: ${handler}`);
		
		return this;
	}
	
	/**
	 * Remove all registered event listeners.
	 * @param {?String} [event]
	 * @return {this}
	 */
	reset(event = null){
		if(null == event)
			for(const event in this.#subscribers)
				this.#subscribers[event].splice(0);
		else this.#subscribers[event]?.splice(0);
		return this;
	}
}

/**
 * @typedef BoxedHandler
 * @property {Function} fn
 * @property {?Number} [callsRemaining]
 */
/** @typedef {Function|BoxedHandler} Handler */
/** @typedef {Handler|Handler[]} Handlers */
/** @typedef {Object.<string, Handlers>} HandlerSpec */
