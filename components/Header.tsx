import Image from "next/image";

export function Header() {
  return (
    <header className="w-full">
      <div className="flex items-center justify-center h-24">
        <Image
          src="/Logo/2.png"
          alt="Somthehit Logo"
          width={120}
          height={120}
          className="object-contain"
        />
      </div>
    </header>
  );
}
