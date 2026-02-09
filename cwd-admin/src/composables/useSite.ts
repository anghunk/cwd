import { ref, watch } from 'vue';

const currentSiteId = ref(localStorage.getItem('cwd_admin_site_id') || 'default');

watch(currentSiteId, (val) => {
  if (val) {
    localStorage.setItem('cwd_admin_site_id', val);
  } else {
    localStorage.removeItem('cwd_admin_site_id');
  }
});

export function useSite() {
  return {
    currentSiteId
  };
}
