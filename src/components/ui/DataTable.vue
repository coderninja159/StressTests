<template>
  <div class="data-table-wrap">
    <div v-if="searchable" class="dt-search-row">
      <div class="dt-search">
        <svg class="dt-search-ic" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          v-model="searchQuery"
          type="search"
          class="dt-search-input"
          :placeholder="searchPlaceholder"
          @input="onSearchInput"
        />
      </div>
    </div>

    <div class="dt-scroll">
      <table class="dt-table">
        <thead>
          <tr>
            <th v-for="col in columns" :key="col.key" :class="{ sortable: col.sortable }">
              <button v-if="col.sortable" type="button" class="th-sort" @click="toggleSort(col.key)">
                <span>{{ col.label }}</span>
                <span class="chev" :class="sortClass(col.key)" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </span>
              </button>
              <span v-else>{{ col.label }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td :colspan="columns.length" class="dt-loading">
              <div class="dt-loading-inner skeleton skeleton--light" />
            </td>
          </tr>
          <tr
            v-for="(row, ri) in pageRows"
            v-else
            :key="rowKey(row, ri)"
            class="dt-row"
            :style="{ animationDelay: `${ri * 0.03}s` }"
          >
            <td v-for="col in columns" :key="col.key">
              <slot
                :name="'cell-' + col.key"
                :row="row"
                :value="row[col.key]"
                :index="globalRowIndex(ri)"
              >
                {{ row[col.key] }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="!loading && !pageRows.length" class="dt-empty">
      <slot name="empty">
        <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" class="dt-empty-ic" aria-hidden="true">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
          <path d="M8 8l6 6" />
          <path d="M14 8l-6 6" />
        </svg>
        <p>{{ emptyMessage }}</p>
      </slot>
    </div>

    <div v-if="!loading && totalRows > 0" class="dt-pager">
      <template v-if="paginationMode === 'simple'">
        <button type="button" class="pg-btn" :disabled="page <= 1" @click="goPage(page - 1)">Oldingi</button>
        <span class="pg-info">{{ page }} / {{ totalPages }}</span>
        <button type="button" class="pg-btn" :disabled="page >= totalPages" @click="goPage(page + 1)">Keyingi</button>
      </template>
      <template v-else>
        <button type="button" class="pg-btn" :disabled="page <= 1" @click="goPage(page - 1)">Oldingi</button>
        <div class="pg-nums">
          <button
            v-for="n in pageNumbers"
            :key="n"
            type="button"
            class="pg-num"
            :class="{ active: n === page }"
            @click="goPage(n)"
          >
            {{ n }}
          </button>
        </div>
        <button type="button" class="pg-btn" :disabled="page >= totalPages" @click="goPage(page + 1)">Keyingi</button>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";

const props = defineProps({
  columns: { type: Array, default: () => [] },
  rows: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  searchable: { type: Boolean, default: false },
  searchPlaceholder: { type: String, default: "Qidiruv..." },
  searchKeys: { type: Array, default: null },
  emptyMessage: { type: String, default: "Ma'lumot topilmadi" },
  pageSize: { type: Number, default: 10 },
  /** 'simple' — faqat oldingi/keyingi; 'numbers' — sahifa raqamlari */
  paginationMode: { type: String, default: "simple" },
  rowKeyField: { type: String, default: "id" },
  /** Tashqaridan (masalan, dropdown) saralashni majburan yangilash */
  externalSortKey: { type: String, default: "" },
  externalSortDir: { type: String, default: "asc" },
});

const emit = defineEmits(["sort", "search", "page-change"]);

const searchQuery = ref("");
const sortKey = ref("");
const sortDir = ref("asc");
const page = ref(1);

const keysToSearch = computed(() => {
  if (props.searchKeys?.length) return props.searchKeys;
  return props.columns.map((c) => c.key);
});

const filteredRows = computed(() => {
  let list = [...props.rows];
  const q = searchQuery.value.trim().toLowerCase();
  if (props.searchable && q) {
    list = list.filter((row) =>
      keysToSearch.value.some((k) => String(row[k] ?? "").toLowerCase().includes(q)),
    );
  }
  if (sortKey.value) {
    const k = sortKey.value;
    const dir = sortDir.value === "asc" ? 1 : -1;
    list.sort((a, b) => {
      const va = a[k];
      const vb = b[k];
      if (typeof va === "boolean" && typeof vb === "boolean") {
        const na = va ? 1 : 0;
        const nb = vb ? 1 : 0;
        return (na - nb) * dir;
      }
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return String(va ?? "").localeCompare(String(vb ?? ""), "uz") * dir;
    });
  }
  return list;
});

const totalRows = computed(() => filteredRows.value.length);
const totalPages = computed(() => Math.max(1, Math.ceil(totalRows.value / props.pageSize)));

const pageRows = computed(() => {
  const start = (page.value - 1) * props.pageSize;
  return filteredRows.value.slice(start, start + props.pageSize);
});

const pageNumbers = computed(() => {
  const out = [];
  const max = totalPages.value;
  const cur = page.value;
  const window = 2;
  let from = Math.max(1, cur - window);
  let to = Math.min(max, cur + window);
  if (to - from < 4) {
    if (from === 1) to = Math.min(max, from + 4);
    else from = Math.max(1, to - 4);
  }
  for (let i = from; i <= to; i += 1) out.push(i);
  return out;
});

watch(
  () => props.rows,
  () => {
    page.value = 1;
  },
);

watch(
  () => [props.externalSortKey, props.externalSortDir],
  () => {
    if (props.externalSortKey) {
      sortKey.value = props.externalSortKey;
      sortDir.value = props.externalSortDir === "desc" ? "desc" : "asc";
      page.value = 1;
    }
  },
  { immediate: true },
);

watch(filteredRows, () => {
  if (page.value > totalPages.value) page.value = totalPages.value;
});

function rowKey(row, ri) {
  const id = row[props.rowKeyField];
  return id != null ? String(id) : String(ri);
}

function onSearchInput() {
  page.value = 1;
  emit("search", searchQuery.value);
}

function toggleSort(key) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === "asc" ? "desc" : "asc";
  } else {
    sortKey.value = key;
    sortDir.value = "asc";
  }
  page.value = 1;
  emit("sort", { key: sortKey.value, dir: sortDir.value });
}

function sortClass(key) {
  if (sortKey.value !== key) return "";
  return sortDir.value === "asc" ? "asc" : "desc";
}

function goPage(n) {
  const next = Math.min(Math.max(1, n), totalPages.value);
  page.value = next;
  emit("page-change", next);
}

function globalRowIndex(ri) {
  return (page.value - 1) * props.pageSize + ri + 1;
}
</script>

<style scoped>
.data-table-wrap {
  width: 100%;
}

.dt-search-row {
  margin-bottom: 0.75rem;
}

.dt-search {
  position: relative;
  max-width: 320px;
}

.dt-search-ic {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted-prof, #94a3b8);
  pointer-events: none;
}

.dt-search-input {
  width: 100%;
  padding: 0.6rem 0.75rem 0.6rem 2.5rem;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: var(--radius-sm-prof, 8px);
  font-size: 0.9rem;
  background: var(--bg-card-prof, #fff);
  color: var(--text-primary-prof, #0f172a);
  transition: border-color var(--duration-fast, 150ms) var(--ease-out, ease), box-shadow var(--duration-fast, 150ms) var(--ease-out, ease);
}

.dt-search-input:focus {
  outline: none;
  border-color: var(--border-focus, #6366f1);
  box-shadow: 0 0 0 3px var(--color-primary-muted, rgba(99, 102, 241, 0.15));
}

.dt-scroll {
  overflow-x: auto;
}

.dt-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.dt-table th {
  text-align: left;
  padding: 0.65rem 0.75rem;
  font-weight: 700;
  color: var(--text-secondary-prof, #475569);
  border-bottom: 1px solid var(--border-color, #e2e8f0);
  white-space: nowrap;
}

.dt-table th.sortable {
  padding: 0;
}

.th-sort {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  width: 100%;
  padding: 0.65rem 0.75rem;
  border: none;
  background: none;
  font: inherit;
  font-weight: 700;
  color: inherit;
  cursor: pointer;
  transition: color var(--duration-fast, 150ms) var(--ease-out, ease);
}

.th-sort:hover {
  color: var(--color-primary, #6366f1);
}

.chev {
  display: inline-flex;
  opacity: 0.35;
  transition: transform 0.2s ease;
}

.chev.asc {
  opacity: 1;
  transform: rotate(180deg);
}

.chev.desc {
  opacity: 1;
}

.dt-table td {
  padding: 0.65rem 0.75rem;
  border-bottom: 1px solid var(--bg-page, #f1f5f9);
  color: var(--text-primary-prof, #0f172a);
}

.dt-row {
  animation: fadeIn 0.35s var(--ease-out, ease) both;
  transition: background var(--duration-fast, 150ms) var(--ease-out, ease);
}

.dt-row:hover {
  background: var(--bg-card-hover-prof, #fafafa);
}

.dt-loading {
  padding: 0;
  border: none;
}

.dt-loading-inner {
  height: 120px;
  margin: 0.5rem;
}

.dt-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem 1rem;
  color: var(--text-muted-prof, #94a3b8);
  text-align: center;
}

.dt-empty-ic {
  opacity: 0.45;
}

.dt-empty p {
  margin: 0;
  font-weight: 600;
}

.dt-pager {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color, #e2e8f0);
}

.pg-btn {
  padding: 0.45rem 0.85rem;
  border-radius: var(--radius-sm-prof, 8px);
  border: 1px solid var(--border-color, #e2e8f0);
  background: var(--bg-card-prof, #fff);
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  color: var(--text-primary-prof, #0f172a);
  transition: border-color var(--duration-fast, 150ms) var(--ease-out, ease), color var(--duration-fast, 150ms) var(--ease-out, ease);
}

.pg-btn:hover:not(:disabled) {
  border-color: var(--color-primary, #6366f1);
  color: var(--color-primary, #6366f1);
}

.pg-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.pg-info {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary-prof, #475569);
}

.pg-nums {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
  justify-content: center;
}

.pg-num {
  min-width: 2rem;
  height: 2rem;
  padding: 0 0.35rem;
  border-radius: var(--radius-sm-prof, 8px);
  border: 1px solid var(--border-color, #e2e8f0);
  background: var(--bg-card-prof, #fff);
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
  color: var(--text-secondary-prof, #475569);
  transition: all var(--duration-fast, 150ms) var(--ease-out, ease);
}

.pg-num:hover {
  border-color: var(--color-primary-muted, rgba(99, 102, 241, 0.35));
  color: var(--color-primary, #6366f1);
}

.pg-num.active {
  background: var(--color-primary, #6366f1);
  border-color: var(--color-primary, #6366f1);
  color: #fff;
}
</style>
