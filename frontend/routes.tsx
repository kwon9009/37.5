@import "tailwindcss";

@theme {
  --font-sans: "Pretendard", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Apple SD Gothic Neo",
    "Noto Sans KR", sans-serif;

  --color-background: #fff8f6;
  --color-foreground: #412b2d;

  --color-card: #ffffff;
  --color-card-foreground: #412b2d;

  --color-muted: #fbe8e4;
  --color-muted-foreground: #806467;

  --color-border: #f1d6d0;
  --color-input: #f1d6d0;
  --color-ring: #d76773;

  --color-primary: #f9cdc4;
  --color-primary-foreground: #5a3035;

  --color-accent: #e58d91;
  --color-accent-foreground: #412b2d;

  --color-danger: #c94753;
  --color-danger-foreground: #ffffff;

  --color-success: #b95f69;

  --radius: 1rem;
}

* {
  border-color: var(--color-border);
}

html,
body,
#root {
  height: 100%;
}

body {
  margin: 0;
  background-color: var(--color-background);
  color: var(--color-foreground);
  -webkit-font-smoothing: antialiased;
}

/* App is presented as a phone frame centered on larger screens */
.app-shell {
  width: 100%;
  max-width: 26rem;
  margin: 0 auto;
  min-height: 100%;
  position: relative;
}

@media (min-width: 480px) {
  .app-shell {
    box-shadow: 0 20px 60px -20px rgba(215, 103, 115, 0.24);
  }
}

@keyframes pulse-ring {
  0% {
    transform: scale(0.9);
    opacity: 0.7;
  }
  70% {
    transform: scale(1.3);
    opacity: 0;
  }
  100% {
    opacity: 0;
  }
}
.pulse-ring {
  animation: pulse-ring 1.8s cubic-bezier(0.24, 0, 0.38, 1) infinite;
}

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.fade-up {
  animation: fade-up 0.3s ease-out both;
}
