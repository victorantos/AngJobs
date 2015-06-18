app.filter('highlight', ['$sce', function ($sce) {
    return function (text, phrase) {
        if (phrase)
            text = text.replace(new RegExp('(' + phrase + ')', 'gi'), '<span style="background-color:yellow">$1</span>');
        return $sce.trustAsHtml(text);
    }
}]);
