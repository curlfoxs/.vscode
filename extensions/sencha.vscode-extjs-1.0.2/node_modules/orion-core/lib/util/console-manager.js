'use strict';

// Add colors to String prototype
require('colors');

class ConsoleManager {
    
    constructor() {
        this._console = console;
    }
    
    set console(c) {
        this._console = c;
    }
    
    get console() {
        return this._console;
    }
    
}

module.exports = new ConsoleManager();
