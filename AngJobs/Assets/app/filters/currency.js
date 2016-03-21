app.filter('currency', ['utils', function (utils) {
    var _this = this;
    this.utils = utils;
    return function (currencyCode) {
        _this.utils;
        if (currencyCode === 0) {
            return _this.utils.CurrencySymbol[0];
        } else if (currencyCode === 1) {
            return _this.utils.CurrencySymbol[1];
        } else if (currencyCode === 2) {
            return _this.utils.CurrencySymbol[2];
        }
    }
}]);