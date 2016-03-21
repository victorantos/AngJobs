app.filter('currency', function () {
    return function (currencyCode) {
        if (currencyCode === 0) {
            return '£';
        } else if (currencyCode === 1) {
            return '€';
        } else if (currencyCode === 2) {
            return '$';
        }
    }
})