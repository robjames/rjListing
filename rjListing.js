angular.module('rjListing', [])
.factory('Listing', ['$http', '$log', '$q', function($http, $log, $q){
	var listing = function(){
		var that = this;
		this.data = [];
		this.params = {};
		this.deferred = $q.defer();
		this.successCallback_append = function(data, status, headers, config){
			//console.log(data, status, headers, config);
			that.totalCount = data.totalCount;
			that.data = that.data.concat(data.rows);
			that.error = null;
			that.loading = false;
		};
		this.successCallback_replace = function(data, status, headers, config){
			//console.log(data, status, headers, config);
			that.totalCount = data.totalCount;
			that.data = data.rows;
			that.error = null;
			that.loading = false;
		};
		this.errorCallback = function(data, status, headers, config){
			that.error = {
				data: data,
				status: status,
				headers: headers,
				config: config
			};
			//$log.error(data, status, headers, config);
			that.loading = false;
		};
		this.isLoading = function(){
			return (that.loading) ? 'loading' : 'notLoading';
		};
		this.setPath = function(path){
			that.dataPath = path.toString().toLowerCase();
			return that;
		};
		this.setParameters = function(parameters){
			angular.extend(that.params, parameters);
			return that;
		};
		this.setParameter = function(key, val){
			that.params[key] = val;
			return that;
		};
		this.incStart = function(negative){
			var multiplier = (negative) ? -1 : 1;
			var add = Number(that.params.limit) * multiplier;

			var num = Number(that.params.start) + add;
			if (num >= that.totalCount) return that;
			if (num < 0) return that;

			that.params.start = num;
			return that;
		};
		this.addFilter = function(obj){
			var filterArray = that._getFilters();

			filterArray.push(obj);

			that._saveFilters(filterArray);
		};
		this.removeFilter = function(obj){
			var filterArray = that._getFilters();

			filterArray = filterArray.filter(function(o, i, a){
				return !(angular.equals(o, obj));
			});

			that._saveFilters(filterArray);
		};
		this._getFilters = function(){
			var filterString = that.params.filter || '[]';
			var filterArray = JSON.parse(filterString);

			return filterArray;
		};
		this._saveFilters = function(filterArray){
			var filterString = JSON.stringify(filterArray);
			that.params.filter = filterString;
		};
		this._reqSetup = function(){
			that.loading = true;
			that.setParameter('cache', new Date().getTime());
			that.deferred.resolve();
			that.deferred = $q.defer();
		};
		this.checkJSON = function(data){
			//added to catch bad json from server. Would love to remove this as it means the data is being parsed three times. (but don't want to overwrite existing angular parse)
			data = data.replace(/\t/gi, '\\t');
			try {
	            var data2 = JSON.parse(data);
            } catch (err) {
	            return that.errorCallback(err, 202);
            }
			return data;
		};
		this.get = function(){
			that._reqSetup();
			$http.get(that.dataPath, {timeout:that.deferred.promise, params:that.params, transformResponse: [that.checkJSON].concat($http.defaults.transformResponse)}).success(that.successCallback_replace).error(that.errorCallback);
		};
		this.getMore = function(){
			that._reqSetup();
			$http.get(that.dataPath, {timeout:that.deferred.promise, params:that.params, transformResponse: [that.checkJSON].concat($http.defaults.transformResponse)}).success(that.successCallback_append).error(that.errorCallback); //note success callback for difference
		};
	};

	return listing;

}])
.directive('ieListing', [function(){
	return {
		restrict: 'A',
		scope: true,
		template: function(tElement, tAttrs){
			tElement.prepend('<div ie-Listing-Error />');
			tElement.append('<div ie-Listing-Toolbar />');
		},
		controller: ['$scope','Listing', function(scope, Listing){

			scope.list = new Listing();

			scope.list.more = function(){
				if (scope.list.disableMore()) return false;
				scope.list.incStart().getMore();
				return false;
			};
			scope.list.next = function(){
				if (scope.list.disableNext()) return false;
				scope.list.incStart().get();
				return false;
			};
			scope.list.previous = function(){
				if (scope.list.disablePrevious()) return false;
				scope.list.incStart(true).get();
				return false;
			};
			scope.list.first = function(){
				if (scope.list.disableFirst()) return false;
				scope.list.setParameter('start', 0).get();
				return false;
			};
			scope.list.last = function(){
				if (scope.list.disableLast()) return false;
				var limit = scope.list.totalCount - scope.list.params.limit;
				if (limit <= 0) return false;
				scope.list.setParameter('start', limit).get();
				return false;
			};

			scope.list.disableFirst = function(){
				return (scope.list.params.start <= 0);
			};
			scope.list.disablePrevious = function(){
				return (scope.list.params.start <= 0);
			};
			scope.list.disableMore = function(){
				var limit = scope.list.totalCount - scope.list.params.limit;
				return (scope.list.params.start >= limit);
			};
			scope.list.disableNext = function(){
				var limit = scope.list.totalCount - scope.list.params.limit;
				return (scope.list.params.start >= limit);
			};
			scope.list.disableLast = function(){
				var limit = scope.list.totalCount - scope.list.params.limit;
				return (scope.list.params.start >= limit);
			};

			//
		}],
		link: function(scope, element, attrs){
			var path = attrs.ieListing || '';
			scope.list.setPath(path).setParameters({
				start: Number(attrs.start) || 0,
				limit: Number(attrs.limit) || 10,
				sort: attrs.sort || 'ID',
				dir: attrs.dir || 'ASC'
			}).get();
			element.on('mouseenter', 'tbody', function(){
				$(this).addClass('hover');
			}).on('mouseleave', 'tbody', function(){
				$(this).removeClass('hover');
			});
			$(window).on('keydown', function(event){
				if ($(event.target).is(':input')) return;
				if(event.which === 37) { // left
					scope.list.previous();
					event.preventDefault();
				}
				if(event.which === 39) { // right
					scope.list.next();
					event.preventDefault();
				}
				if(event.which === 40) { // down
					scope.list.last();
					event.preventDefault();
				}
				if(event.which === 38) { // up
					scope.list.first();
					event.preventDefault();
				}

				if(event.which === 32) { //space
					scope.list.more();
					event.preventDefault();
				}
			});

		}
	};
}])
.directive('ieFilter', ['$log', '$timeout',function($log, $timeout){
	return {
		restrict: 'A',
		require: '^ieListing',
		link: function(scope, element, attrs){
			var filter = {type:"text", comparison:"ne", textoperator:"eq"};
			angular.extend(filter, attrs);
			filter.field = attrs.ieFilter;
			filter.type = 'text';
			delete filter.$$element;
			delete filter.$attr;

			element.on('change', function(){
				fFilter();
				scope.list.get();
			});

			function fFilter(){
				var checked = (element.is(':checked')) ? true : false;
				if (!!checked) {
					scope.list.removeFilter(filter);
				} else {
					scope.list.addFilter(filter);
				}
			}
			//$timeout(fFilter, 0, false);
			fFilter();

		}
	};
}])
.directive('ieSort', [function(){
	return {
		restrict: 'A',
		require: '^ieListing',
		link: function(scope, element, attrs){
			var ASC = true;
			var sortVal = attrs.ieSort;

			scope.$watchCollection('list.params', function(newVal, oldVal){
				var isActive = (scope.list.params.sort === sortVal) ? true : false;
				if (isActive) {
					var dir = newVal.dir.toUpperCase();
					if (!/(ASC|DESC)/.test(dir)) return false;

					element.parents('[ie-listing]').find('.sort button').removeClass('ASC DESC');
					element.removeClass('ASC DESC').addClass(dir);
				}
			});

			element.on('click', function(){
				ASC = !ASC;
				scope.$apply(function () {
		            scope.list.setParameter('dir', (ASC)?'ASC':'DESC');
					scope.list.setParameter('sort', sortVal);
		        });

				scope.list.get();

			});
		}
	};
}])
.directive('ieListingError', [function(){
	return {
		restrict: 'A',
		require: '^ieListing',
		templateUrl: '/Scripts/ng_ieListing/templates/ieListingErrors.html'
	};
}])
.directive('ieListingToolbar', [function(){
	return {
		restrict: 'A',
		require: '^ieListing',
		templateUrl: '/Scripts/ng_ieListing/templates/ieListingToolbar.html'
	};
}]);