/**
 * Minimal LRUCache Implementation
 */

// We could use plain objects, but in most benchmarks
// V8 performs fastest with classes due to how it optimizes hidden classes.
class LRUCacheNode {
  next = null;
  prev = null;
  key;
  value;

  constructor(value, key) {
    this.value = value;
    this.key = key;
  }
}

/**
 * Generic Friendly LRUCache.
 * This is implemented with a doubley-link'd list.
 *
 * * We keep a map of key => doubley-link'd list node, so we can lookup in
 * constant time.
 *
 * * Each list node is aware of its relative ordering in terms of recently
 * used, so on set, get, and remove, we can update ordering in constant time.
 *
 * * This implementation tries to avoid memory allocations where possible.
 * e.g. it 'pools' or re-uses the list nodes when we would go over max-size,
 * instead of allocating new ones.
 */
export default class LRUCache {
  head = null;
  tail = null;
  data;
  maxSize;
  currentSize;

  constructor(maxSize) {
    this.data = {};
    this.maxSize = maxSize;
    this.currentSize = 0;
  }

  /**
   * Get a value by key. Updates this key to be most recently used
   */
  get(key) {
    const node = this.data[key];
    if (node !== undefined) {
      this._removeNodeFromList(node);
      this._setHeadNode(node);
      return node.value;
    }
  }

  /**
   * Set this value to key.
   * If adding this item to the cache would increase the cache's
   * beyond the max size, remove the oldest value from the cache.
   * NOTE: this implementation re-uses the old value of the cache
   * node to avoid un-necessary allocations.
   */
  set(key, value) {
    // first check if there's an existing node
    let node = this.data[key];

    if (node === undefined) {
      // if there isn't a node, and we're at the max size, re-use the last node
      if (this.currentSize === this.maxSize) {
        node = this.tail; // if we're at max-size, we'll have a tail.
        // remove the old entry and update the values
        this._removeNodeFromList(node);
        // NOTE: this doesn't decrease key size, but prevents
        // V8 from de-optimizing this object.
        this.data[node.key] = undefined;
        node.key = key;
        node.value = value;
      } else {
        // add a new node;
        node = new LRUCacheNode(value, key);
        this.currentSize += 1;
      }

      this.data[key] = node;
    } else {
      this._removeNodeFromList(node);
    }

    this._setHeadNode(node);

    return this;
  }

  /**
   * Remove a key's value from the cache
   */
  remove(key) {
    const node = this.data[key];
    if (node !== undefined) {
      this._removeNodeFromList(node);
      // NOTE: this doesn't decrease key size, but prevents
      // V8 from de-optimizing this object.
      this.data[key] = undefined;
      this.currentSize -= 1;
    }

    return this;
  }

  /**
   * Remove a node from the list
   */
  _removeNodeFromList(node) {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
      if (this.head) {
        this.head.prev = null;
      }
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
      if (this.tail) {
        this.tail.next = null;
      }
    }
  }

  /**
   * Helper to move a node to the front of the list and update ordering
   * Note: expects the node to not be in the list;
   */
  _setHeadNode(node) {
    if (node === this.head) {
      return;
    }

    // Move it to the head.
    node.next = this.head;
    node.prev = null;

    if (this.head !== null) {
      this.head.prev = node;
    }

    this.head = node;

    // set tail if needed
    if (this.tail === null) {
      this.tail = node;
    }
  }
}
