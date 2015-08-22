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

    insert: function (value, key) {
        var node = new FibonacciNode(value, key);
        this.minNode = mergeNodeLists(this.minNode, node, this._compare);
        this.length++;

        return node;
    },

    findMinimum: function () {
        return this.minNode;
    },

    _compare: function (a, b) {
        if (a.key > b.key) {
            return 1;
        } else if (b.key > a.key) {
            return -1;
        } else {
            return 0;
        }
    }
};

mergeNodeLists = function (a, b, cmpFn) {
    var aIsFibNode = a instanceof FibonacciNode;
    var bIsFibNode = b instanceof FibonacciNode;

    // return if one is not a proper node
    if (!aIsFibNode && !bIsFibNode) {
        return undefined;
    } else if (!aIsFibNode) {
        return b;
    } else if (!bIsFibNode) {
        return a;
    }

    // Add node into circular node list
    var temp = a.next;

    a.next = b.next;
    a.next.prev = a;

    b.next = temp;
    b.next.prev = b;

    // return the min of a and b
    return cmpFn(a, b) > 0 ? a : b;
};
