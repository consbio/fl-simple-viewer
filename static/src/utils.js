/**
 * General utility functions.
 * Some require d3.  Others require lodash.
 */


/**
 * NEW
 * Map an array of properties, and an array of values per property to an array of objects:
 * [{<prop1>: <v>, <prop2>: <l>},...]
 * @param {string[]} properties - the properties to add to each object.  Must match number of arrays passed in
 * @param {..Array} [arrays] - The arrays to process
 * @returns {Array} Returns array of objects with properties and values
 */
function zipIntoObj(properties, arrays){
    return _.unzip(_.tail(arguments)).map(function(d){
        var obj = {};
        properties.forEach(function(p, i){
            obj[p] = d[i];
        });
        return obj;
    })
}



/**
 * Cast string fields to numeric type, if possible, during loading of a CSV file.
 * Operates on rows in place.
 * @param {Object} row - The row to modify.
 * @param {string[]} skipFields - The list of fields to skip.
 * @returns nothing
 */
function castFields(row, skipFields) {
    var fields = d3.keys(row);
    if (skipFields) {
        fields = fields.filter(function (d) {
            return skipFields.indexOf(d) == -1
        });
    }

    fields.forEach(function (d) {
        if (value == '') {
            return;
        }
        var value = +row[d];
        if (!(isNaN(value) || (value.trim && value.trim() == ''))) {
            row[d] = value;
        }
    }, this);
}


/**
 * Calculate the set intersection between two d3 sets.
 * NOTE: this is handled in similar form by _.intersection
 * @param {d3.set} set1 - first set.
 * @param {d3.set} set2 - second set.
 * @returns {d3.set} Set intersection of set1 and set2.
 */
function setIntersection(set1, set2) {
    var intersection = d3.set([]);
    var left, right;
    if (set1.size() < set2.size()) {
        left = set1;
        right = set2;
    }
    else {
        left = set2;
        right = set1;
    }
    left.forEach(function (d) {
        if (right.has(d)) {
            intersection.add(d);
        }
    });
    return intersection;
}

/**
 * Calculate the set difference between two d3 sets.
 * @param {d3.set} set1 - first set.
 * @param {d3.set} set2 - second set.
 * @returns {d3.set} Set difference: items in set1 that are not present in set2.
 */
function setDifference(set1, set2) {
    var difference = d3.set([]);
    set1.forEach(function (d) {
        if (!set2.has(d)) {
            difference.add(d);
        }
    });
    return difference;
}

/**
 * Is one set a subset of another set?
 * @requires lodash
 * @param {d3.set} set1 - first set.
 * @param {d3.set} set2 - second set.
 * @returns {Boolean} Returns true if set1 is a subset of set2.
 */
function isSubset(set1, set2) {
    // true if set1 is subset of set2
    return _.every(set1.values(), function (d) {
        return set2.has(d)
    });
}

/**
 * Is one array a subset of another array?
 * @requires lodash
 * @param {Object[]} arr1 - first array.
 * @param {Object[]} arr2 - second array.
 * @returns {Boolean} Returns true if arr1 is a subset of arr2.
 */
function isSubsetArray(arr1, arr2) {
    return _.every(arr1, function (d) {
        return arr2.indexOf(d) != -1
    });
}


/**
 * Decodes a pipe encoded dictionary field.
 * @param {String} text - the text to decode.  Example: "A:1|B:2"
 * @returns {d3.map} Returns a d3 map of each key to each value.  Example: d3.map({A:1, B:2})
 */
function decodeDictField(text) {
    if (text == null || text == '') {
        return d3.map();
    }

    var out = d3.map();
    text.split('|').forEach(function (d) {
        var split = d.split(':');
        var parsed = parseFloat(split[1]);
        out.set(split[0], (!isNaN(parsed)) ? parsed : split[1]);
    });
    return out;
}

/**
 * This class provides a look-back encoder, which stores an index and string on the first occurrence of that string.
 * Later instances use use the index to retrieve that string.
 * TODO: could probably be optimized further.
 * @class
 */
var LookBackEncoder = (function () {
    function LookBackEncoder(data) {
        this._by_value = {};
        this._by_index = {};
        if (data != null && data.length != null && data.length > 0) {
            data.forEach(function (value, index) {
                this._by_index[index] = value;
            }, this);
        }
    }
    /**
     * Adds a new string into the encoding.
     * @param {String} value - the text to encode.
     * @param {Number} index - the current row index of the string.
     * @returns {String} Returns the original string if it hasn't been encoded previously, or "~" plus the index if it has.
     */
    LookBackEncoder.prototype.encode = function (value, index) {
        if (this._by_value[value] != null) {
            return '~' + this._by_value[value];
        }
        this._by_value[value] = index;
        this._by_index[index] = value;
        return value;
    };
    /**
     * Decode a text string to its original text string.
     * Index must be initialized first by reading in all encoded rows.
     * @param {String} value - the text to decode, either the full string or "~" plus an index.
     * @returns {String} Returns the original string.
     */
    LookBackEncoder.prototype.decode = function (value) {
        if (!value) {return value}
        if (!this._by_index) {
            throw 'No data in index';
        }
        if (value.search(/~\d+/) == 0) {
            var index = value.replace(/~/, '');
            if (this._by_index[index] != null) {
                return this._by_index[index];
            }
            throw 'Index not in data';
        }
        return value;
    };
    return LookBackEncoder;
})();


/**
 * Aggregate values (sum if number, aggregate if string)
 * @requires lodash
 *
 * @param {objValue} number or unique list of strings.
 * @param {srcValue} string or number to aggregate into objValue.
 * @returns {Object} Returns Object with union of keys, and sum of values if they are numbers, and unique set of strings if they are strings.
 */
function aggregateLeafValues(objValue, srcValue) {
  if (_.isNumber(srcValue)){ // sum values
    return (objValue != null)? objValue + srcValue: srcValue;
  }
  if (_.isString(srcValue)){ // aggregate to unique list
    return (objValue != null)? _.union(objValue, [srcValue]): [srcValue];
  }
}

/**
 * Merge the data for nested objects
 * @requires lodash
 *
 * Example:
 * var j={1:{a:5}, 3:{z:20}}
 * var k={1:{a:10, b:2}, 2:{c:20}}
 * aggregateMerge([j, k]) ==> {1: {a: 15, b:2}, 2: {c:20}, 3: {z:20}}
 *
 * @param {items} array of like objects
 * @returns {Object} Returns Object with merged values (summed leaf values and a union on keys)
 */
function aggregateMerge(items){
  var out = {};
  items.forEach(function(item){
    _.mergeWith(out, item, aggregateLeafValues)
  });
  return out;
}

/**
 * Merge the data for arrays of values
 * @requires lodash
 *
 * Example:
 * var j=[44, 22]
 * var k=[44, 22]
 * arraySum([j, k]) ==> [88, 44]
 *
 * @param {items} arrays of same-dimension
 * @returns {array} Returns array with values summed at each index
 */
function sumArraysByIndex(items){
    return _.spread(_.zip)(items).map(_.sum)
}
