import "dotenv/config";
import { createApp } from "./server";

const port = Number(process.env.API_PORT ?? 3333);
createApp().listen(port, () => console.log(`API mock da loja rodando em http://localhost:${port}`));
