"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Dictionary {
    constructor() {
        this.items = {};
        this.count = 0;
    }
    Add(key, value) {
        if (!this.items.hasOwnProperty(key))
            this.count++;
        this.items[key] = value;
    }
    ContainsKey(key) {
        return this.items.hasOwnProperty(key);
    }
    Count() {
        return this.count;
    }
    Remove(key) {
        var val = this.items[key];
        delete this.items[key];
        this.count--;
    }
    Item(key) {
        return this.items[key];
    }
    Keys() {
        var keySet = [];
        for (var prop in this.items) {
            if (this.items.hasOwnProperty(prop)) {
                keySet.push(prop);
            }
        }
        return keySet;
    }
    Values() {
        var values = [];
        for (var prop in this.items) {
            if (this.items.hasOwnProperty(prop)) {
                values.push(this.items[prop]);
            }
        }
        return values;
    }
}
exports.Dictionary = Dictionary;
//# sourceMappingURL=Dictionary.js.map