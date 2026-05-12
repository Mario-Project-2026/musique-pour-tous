import Image from "next/image";
import MusicLibrary from "@/components/MusicLibrary";
import { AuthButton } from "@/components/AuthButton";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <section className="relative h-[500px] w-full flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black z-10" />
        <Image
          src="/images/hero.png"
          alt="Musique Pour Tous - Music for Everyone"
          fill
          className="object-cover"
          priority
        />
        <div className="relative z-20 text-center text-white">
          <h1 className="text-5xl font-bold mb-4">Musique Pour Tous</h1>
          <p className="text-xl text-gray-300 mb-8">
            La musique gratuite pour tous
          </p>
          <AuthButton />
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-white mb-8">Découvrez les albums</h2>
        <MusicLibrary />
      </section>
    </main>
  );
}
