import { createFileRoute } from "@tanstack/react-router";
import Auth from "@/pages/Auth";

export const Route = createFileRoute("/auth/")({
  head: () => ({ meta: [
    { title: "Вход и регистрация | LinkMax" },
    { name: "description", content: "Войдите в LinkMax или создайте аккаунт для управления своей страницей." },
    { property: "og:title", content: "Вход и регистрация | LinkMax" },
    { property: "og:description", content: "Войдите в LinkMax или создайте аккаунт для управления своей страницей." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Auth,
});
