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
    this.digree = this;

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
            bubbleCut(parent, this.minNode, compare);
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
                nextRoot = target.next;
            }

            removeNodeFromList(target);
            this.nodeCount--;

            this.minNode = mergeNodeLists(nextRoot, child, compare);
            if (nextRoot) {
                this.minNode = nextRoot;
                this.minNode = linkRoots(this.minNode, compare);
            }
        }
        return target;
    },

    delete: function (node) {
        var parent = node.parent;

        node.isMinimum = true;

        if (parent) {
            cutNode(node, parent, this.minNode, this._compare);
            bubbleCut(parent, this.minNode, this._compare);
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
        } else if (bKey > aKey) {
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
    parent.degree--;
    if(node.next === node) {
        parent.child = undefined;
    } else {
        parent.child = node.next;
    }

    node.isMarked = false;
    removeNodeFromList(node);
    mergeNodeLists(min, node, cmpFn);
}

function bubbleCut(node, min, cmpFn) {
    var parent = node.parent;
    var currentNode = node;

    if(parent instanceof FibonacciNode) {
        if(node.isMarked) {
            /**
             * if !(parent instanceof FibonacciNode), then node.isMarked must be
             * false because it must be the minNode. So we don't need to check
             * if (parent instanceof FibonacciNode) during the while loop.
             * However, the reverse is not always true, so we must perform the
             * check afterwards, and respond appropriately.
             */
            while(node.isMarked) {
                cutNode(node, parent, min, cmpFn);

                node = parent;
                parent = node.parent;
            }
            if(parent instanceof FibonacciNode) {
                node.isMarked = true;
            }
        } else {
            node.isMarked = true;
        }
    }
}

function mergeHeaps(max, min, cmpFn) {
    removeNodeFromList(max);
    min.child = mergeNodeLists(max, min.child, cmpFn);
    max.parent = min;
    max.isMarked = false;
}

function linkRoots(min, cmpFn) {
    var current = min;
    var processing = min;
    var degreeCache = {};
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
}
