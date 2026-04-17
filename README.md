This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev

# if you want to use with tailscale
npm run dev -- -H 0.0.0.0
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

To deploy to fly.io when you're ready:   
first generate a hash without bars for your password:
```bash
node -e '
  let b = require("bcryptjs");
  let try_hash = async () => {
    let h = await b.hash("YourPassword", 12);
    if (h.includes("/")) { console.log("has slash, retrying..."); return try_hash(); }
    console.log(h);
  };
  try_hash();
  '
```
get the part after $2b$12$ then prepare the loaded secrets:
```bash                                                                                                                                                                                  
fly launch --no-deploy                                                                                                                                                                      
fly volumes create claude_lite_data -r cdg -s 1     

fly secrets set \                                                                                                                                                                           
ANTHROPIC_API_KEY="sk-ant-..." \
AUTH_PASSWORD_HASH="<your hash without the $2b$12$>" \                                                                                   
AUTH_COOKIE_SECRET="$(openssl rand -hex 32)"  

fly deploy    
```