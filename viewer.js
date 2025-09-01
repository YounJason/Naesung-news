document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('.time-local').forEach((el) => {
        const date = new Date(el.getAttribute('datetime'));
        if (!isNaN(date)) {
          const pad = (n) => String(n).padStart(2, '0');
          const formatted = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
          el.textContent = formatted;
        }
      });
    });
