import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;

const remotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
  {
    protocol: "https",
    hostname: "**.supabase.co",
    pathname: "/**",
  },
];

if (supabaseUrl) {
  try {
    const parsed = new URL(supabaseUrl);
    const protocol = parsed.protocol.replace(":", "");
    if (protocol === "http" || protocol === "https") {
      remotePatterns.push({
        protocol,
        hostname: parsed.hostname,
        pathname: "/**",
      });
    }
  } catch {
    // ignora URL invalida para nao quebrar build local
  }
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
  },
};

export default nextConfig;
