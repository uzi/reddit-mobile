import createTest from 'platform/createTest';
import LRUCache from 'lib/LRUCache';

createTest(({ getStore, expect }) => {
  describe('lib: LRUCache', () => {
    const realNumItems = cache =>
      Object
        .keys(cache.data)
        .reduce((sum, key) => {
          if (cache.data[key] !== undefined) {
            sum += 1;
          }
          return sum;
        }, 0);

    it('should never store more than the MAX_SIZE items', () => {
      const testNumCacheEntries = maxSize => {
        const cache = new LRUCache(maxSize);
        // make sure if we go over maxSize, the cache stays limited
        for (let i = 0; i < maxSize + 1; i++) {
          cache.set(`key=${i}`, { i });
        }
  
        expect(cache.currentSize).to.eql(maxSize);
        expect(realNumItems(cache)).to.eql(maxSize);
      };

      // there's head and tail pointer, and there can be items in the list.
      // so let's test having 1,2,3, and 10 as the max size
      [1, 2, 3, 10].forEach(maxSize => testNumCacheEntries(maxSize));
    });

    it('should reuse last cache node when we exceed max size', () => {
      const testEntryReuse = maxSize => {
        const cache = new LRUCache(maxSize);
        let firstEntry;
        let lastKey;
        // make sure if we go over maxSize, the cache stays limited
        for (let i = 1; i < maxSize + 2; i++) {
          const key = `key=${i}`;
          lastKey = key;
          cache.set(key, { i });
          if (!firstEntry) {
            firstEntry = cache.data[key];
          }
        }
  
        expect(firstEntry === cache.data[lastKey]).to.eql(true);
      };
  
      // there's head and tail pointer, and there can be items in the list.
      // so let's test having 1,2,3, and 10 as the max size
      [2, 3, 10].forEach(maxSize => testEntryReuse(maxSize));
    });
  });
});
