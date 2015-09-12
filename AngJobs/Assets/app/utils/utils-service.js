angular.module('utils.service', [

])

.factory('utils', function () {

    //if (!String.prototype.format) {
    //    String.prototype.format = function () {
    //        var str = this.toString();
    //        if (!arguments.length)
    //            return str;
    //        var args = typeof arguments[0],
    //            args = (("string" == args || "number" == args) ? arguments : arguments[0]);
    //        for (arg in args)
    //            str = str.replace(RegExp("\\{" + arg + "\\}", "gi"), args[arg]);
    //        return str;
    //    }
    //}

    return {
        CurrencyType: Object.freeze({ "Pound": 0, "Euro": 1, "Usd": 2 }),
        // Util for finding an object by its 'id' property among an array
        findById: function findById(a, id) {
            for (var i = 0; i < a.length; i++) {
                if (a[i].id == id) return a[i];
            }
            return null;
        },

        // Util for returning a randomKey from a collection that also isn't the current key
        newRandomKey: function newRandomKey(coll, key, currentKey) {
            var randKey;
            do {
                randKey = coll[Math.floor(coll.length * Math.random())][key];
            } while (randKey == currentKey);
            return randKey;
        },
        isEmptyObject: function isEmpty(obj) {
            return Object.keys(obj).length === 0;
        }
    };
});