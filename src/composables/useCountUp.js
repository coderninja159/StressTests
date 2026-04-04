import { ref, onMounted } from "vue";

export function useCountUp(target, duration = 1500, decimals = 0) {
  const current = ref(0);

  onMounted(() => {
    if (!target || target === 0) return;

    const startTime = performance.now();
    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      current.value =
        decimals > 0
          ? parseFloat((eased * target).toFixed(decimals))
          : Math.round(eased * target);

      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  });

  return current;
}

