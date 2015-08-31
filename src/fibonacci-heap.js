(function() {
    function FibonacciHeap(cmpFn) {
        this.minNode = undefined;
        this.length = 0;

        if (typeof cmpFn === "function") {
            this._compare = cmpFn;
        }
    }

    function FibonacciNode(value, key) {
        this.key = key;
        this.value = value;
        this.previous = this;
        this.next = this;
        this.degree = 0;

        this.parent = undefined;
        this.child = undefined;
        this.isMarked = false;
        this.isMinimum = false;
    }

    FibonacciHeap.prototype = {
        clear: function () {
            this.minNode = undefined;
            this.length = 0;
        },

        isEmpty: function () {
            return this.minNode === undefined;
        },

        findMinimum: function () {
            return this.minNode;
        },

        insert: function (value, key) {
            var node = new FibonacciNode(value, key);
            this.minNode = mergeNodeLists(this.minNode, node, this._compare);
            this.length++;

            return node;
        },

        union: function (fibHeap) {
            this.minNode = mergeNodeLists(this.minNode, fibHeap.minNode, this._compare);
            this.length += fibHeap.length;
        },

        decreaseKey: function (node, newKey) {
            var parent;
            var compare = this._compare;
            if (!(node instanceof FibonacciNode) || compare(new FibonacciNode(node.value, newKey), node) > 0) {
                return false;
            }

            node.key = newKey;
            parent = node.parent;

            if (parent && compare(node, parent) < 0) {
                cutNode(node, parent, this.minNode, compare);
                // bubbleCut(parent, this.minNode, compare);
            }
            if(compare(node, this.minNode) < 0) {
                this.minNode = node;
            }

            return true;
        },

        extractMinimum: function () {
            var compare = this._compare;
            var target = this.minNode;
            var child;
            var nextRoot;

            if(target) {
                child = target.child;
                if(child instanceof FibonacciNode) {
                    do {
                        child.parent = undefined;
                        child = child.next;
                    } while (child !== target.child);
                }

                if (target.next !== target) {
                    nextRoot = findMinInList(target.next, [target], compare);
                }

                removeNodeFromList(target);
                this.length--;

                this.minNode = mergeNodeLists(nextRoot, child, compare);
                if (nextRoot) {
                    this.minNode = nextRoot;
                    this.minNode = linkRoots(this.minNode, compare);
                }
            }
            return target;
        },

        remove: function (node) {
            if(!(node instanceof FibonacciNode)) {
                return;
            }
            var parent = node.parent;

            node.isMinimum = true;

            if (parent) {
                cutNode(node, parent, this.minNode, this._compare);
                // bubbleCut(parent, this.minNode, this._compare);
            }

            this.minNode = node;

            this.extractMinimum();
        },

        // a and b must be instances of FibonacciNode
        _compare: function (a, b) {
            var aKey = a.key;
            var bKey = b.key;

            if (aKey > bKey) {
                return 1;
            } else if (aKey < bKey) {
                return -1;
            } else {
                return 0;
            }
        }
    };

    function mergeNodeLists(a, b, cmpFn) {
        var aIsFibNode = a instanceof FibonacciNode;
        var bIsFibNode = b instanceof FibonacciNode;

        // check if one is not a proper node
        if (!aIsFibNode && !bIsFibNode) {
            // We don't want to throw an error, since this may have been called on
            // two empty heaps.
            return undefined;
        } else if (!aIsFibNode) {
            return b;
        } else if (!bIsFibNode) {
            return a;
        }

        // Add node into circular node list
        var temp = a.next;

        a.next = b.next;
        a.next.previous = a;

        b.next = temp;
        b.next.previous = b;

        // return the min of a and b
        return cmpFn(a, b) > 0 ? a : b;
    }

    function removeNodeFromList(node) {
        var next = node.next;
        var previous = node.previous;

        previous.next = next;
        next.previous = previous;

        node.next = node;
        node.previous = node;
    }

    function cutNode(node, parent, min, cmpFn) {
        do {
            parent.degree--;
            if(node.next === node) {
                parent.child = undefined;
            } else {
                parent.child = findMinInList(node.next, [node], cmpFn);
            }

            node.isMarked = false;
            removeNodeFromList(node);
            min = mergeNodeLists(min, node, cmpFn);

            node = parent;
            parent = node instanceof FibonacciNode ? node.parent : undefined;
        } while (node instanceof FibonacciNode && node.isMarked && parent instanceof FibonacciNode);

        if(node instanceof FibonacciNode && node !== min) {
            node.isMarked = true;
        }

    }

    function findMinInList(startNode, ignoreList, cmpFn) {
        var node = startNode.next;
        var minNode = startNode;
        ignoreList = ignoreList || [];
        while (node !== startNode) {
            if (!~ignoreList.indexOf(node) && cmpFn(node, minNode) < 0) {
                minNode = node;
            }
        }
        return minNode;
    }

    function mergeHeaps(max, min, cmpFn) {
        var minOfMerge;
        removeNodeFromList(max);
        minOfMerge = mergeNodeLists(max, min.child, cmpFn);
        min.child = findMinInList(minOfMerge);
        max.parent = min;
        max.isMarked = false;
    }

    function linkRoots(min, cmpFn) {
        var current = min;
        var processing = min;
        var degreeCache = {};
        var degreeList;
        do {
            while (degreeCache[current.degree] instanceof FibonacciNode) {
                var temp;
                if (cmpFn(current, degreeCache[current.degree]) > 0) {
                    temp = current;
                    current = degreeCache[current.degree];
                    degreeCache[current.degree] = temp;
                }
                mergeHeaps(degreeCache[current.degree], current, cmpFn);
                degreeCache[current.degree] = undefined;
                current.degree++;
            }
            degreeCache[current.degree] = current;

            current = processing = processing.next;
        } while (processing !== min);

        min = undefined;
        degreeList = Object.keys(degreeCache);
        for (var i = 0; i < degreeList.length; i++) {
            var rootNode = degreeCache[degreeList[i]];
            if (rootNode) {
                // Remove siblings before merging
                rootNode.next = rootNode;
                rootNode.prev = rootNode;
                min = mergeNodeLists(min, rootNode, cmpFn);
            }
        }

        return min;
    }

    if (typeof exports !== 'undefined') {
      if (typeof module !== 'undefined' && module.exports) {
        exports = module.exports = FibonacciHeap;
      }
    }

    if (typeof define === 'function' && define.amd) {
        define(function() {
            return FibonacciHeap;
        });
    }
}());
