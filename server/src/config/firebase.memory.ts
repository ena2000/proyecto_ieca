/**
 * Firestore en memoria para pruebas de integración (IECA_USE_MEMORY_DB=true).
 */

const store = new Map();

function getCollection(name) {
  if (!store.has(name)) store.set(name, new Map());
  return store.get(name);
}

function docSnapshot(id, data) {
  return {
    id,
    exists: data != null,
    data: () => data
  };
}

function querySnapshot(docs) {
  return {
    empty: docs.length === 0,
    docs,
    forEach(fn) {
      docs.forEach(fn);
    }
  };
}

function createDocRef(collectionName, docId) {
  return {
    id: docId,
    get: async () => {
      const col = getCollection(collectionName);
      const data = col.get(docId);
      return docSnapshot(docId, data ?? null);
    },
    set: async (data, options: { merge?: boolean } = {}) => {
      const col = getCollection(collectionName);
      const prev = col.get(docId) || {};
      col.set(docId, options.merge ? { ...prev, ...data } : { ...data });
    },
    create: async (data) => {
      const col = getCollection(collectionName);
      if (col.has(docId)) {
        const err = Object.assign(new Error('Document already exists'), { code: 6 });
        throw err;
      }
      col.set(docId, { ...data });
    },
    delete: async () => {
      getCollection(collectionName).delete(docId);
    }
  };
}

function createCollectionRef(collectionName) {
  return {
    doc(docId) {
      return createDocRef(collectionName, docId);
    },
    async get() {
      const col = getCollection(collectionName);
      const docs = [...col.entries()].map(([id, data]) =>
        docSnapshot(id, { ...data })
      );
      return querySnapshot(docs);
    },
    where(field, _op, value) {
      const filters = [{ field, value }];
      return {
        limit(n) {
          return {
            get: async () => {
              const col = getCollection(collectionName);
              let docs = [...col.entries()]
                .filter(([, data]) =>
                  filters.every((f) => data[f.field] === f.value)
                )
                .map(([id, data]) => docSnapshot(id, { ...data }));
              docs = docs.slice(0, n);
              return querySnapshot(docs);
            }
          };
        },
        get: async () => {
          const col = getCollection(collectionName);
          const docs = [...col.entries()]
            .filter(([, data]) =>
              filters.every((f) => data[f.field] === f.value)
            )
            .map(([id, data]) => docSnapshot(id, { ...data }));
          return querySnapshot(docs);
        }
      };
    },
    orderBy(field, direction = 'asc') {
      return {
        limit(n) {
          return {
            get: async () => {
              const col = getCollection(collectionName);
              let docs = [...col.entries()].map(([id, data]) =>
                docSnapshot(id, { ...data })
              );
              docs.sort((a, b) => {
                const av = a.data()[field];
                const bv = b.data()[field];
                if (av < bv) return direction === 'desc' ? 1 : -1;
                if (av > bv) return direction === 'desc' ? -1 : 1;
                return 0;
              });
              docs = docs.slice(0, n);
              return querySnapshot(docs);
            }
          };
        }
      };
    },
    async add(data) {
      const col = getCollection(collectionName);
      const id = String(Date.now()) + Math.random().toString(36).slice(2, 8);
      col.set(id, { ...data });
      return { id };
    }
  };
}

const db = {
  collection(name) {
    return createCollectionRef(name);
  },
  async runTransaction(fn) {
    const tx = {
      get: (ref) => ref.get(),
      set: (ref, data, options) => {
        void ref.set(data, options || {});
      },
      update: (ref, data) => {
        void ref.set(data, { merge: true });
      }
    };
    return fn(tx);
  },
  batch() {
    const ops = [];
    return {
      set(ref, data, options) {
        ops.push({ type: 'set', ref, data, options });
      },
      delete(ref) {
        ops.push({ type: 'delete', ref });
      },
      async commit() {
        for (const op of ops) {
          if (op.type === 'delete') {
            await op.ref.delete();
          } else {
            await op.ref.set(op.data, op.options || {});
          }
        }
      }
    };
  }
};

function resetMemoryDb() {
  store.clear();
}

function seedMemoryCollection(name, records) {
  const col = getCollection(name);
  for (const rec of records) {
    const id = String(rec.id ?? col.size + 1);
    const { id: _i, ...data } = rec;
    col.set(id, data);
  }
}

module.exports = { admin: {}, db, resetMemoryDb, seedMemoryCollection };
