// Shared type for the server actions wired into <form action={...}> — a plain
// async function taking FormData (Next 16 server actions).
export type ActionResult = (formData: FormData) => Promise<void>;
