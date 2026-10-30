import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, MessageCircle, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-zinc-800 bg-zinc-950 py-12 text-zinc-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative h-9 w-9 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 p-1">
                <Image
                  src="/logo.png"
                  alt="Kasbi POS Logo"
                  width={36}
                  height={36}
                  className="h-full w-full object-contain"
                />
              </div>
              <span className="font-extrabold text-base tracking-tight text-white">Kasbi POS</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Le premier ERP et système de caisse intelligent pensé pour le commerce de détail marocain.
              Conforme DGI, fonctionnel 100% hors-ligne et propulsé par l'IA.
            </p>
            <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Serveurs cloud & réplication locale actifs
            </div>
          </div>

          {/* Solutions */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Modules</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/pos" className="hover:text-white transition">Caisse Tactile Rapide (POS)</Link></li>
              <li><Link href="/dashboard/inventory" className="hover:text-white transition">Gestion des Stocks & Alertes</Link></li>
              <li><Link href="/dashboard/customers" className="hover:text-white transition">Crédits Clients (Krediat / Carnet)</Link></li>
              <li><Link href="/dashboard/suppliers" className="hover:text-white transition">Fournisseurs & Factures d'Achat</Link></li>
              <li><Link href="/dashboard/reports" className="hover:text-white transition">Z-Report & Clôtures Quotidiennes</Link></li>
            </ul>
          </div>

          {/* Superpouvoirs & Tech */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Technologie</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-zinc-400" /> Offline-First (Dexie & SQLite)</li>
              <li className="flex items-center gap-1.5"><MessageCircle className="h-3.5 w-3.5 text-zinc-400" /> WhatsApp Z-Report Automatique</li>
              <li>Multi-Passerelle (YouCan Pay & Paddle)</li>
              <li>Tauri Desktop App (Windows & Mac)</li>
              <li>Assistant IA Multi-Modèles & Vision</li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Support & Contact</h4>
            <p className="text-xs text-zinc-400">
              Assistance technique et support commerçants basé au Maroc :
            </p>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 space-y-1.5">
              <p className="text-xs font-semibold text-white">WhatsApp Support Dédié :</p>
              <a
                href="https://wa.me/212687597267?text=Bonjour,%20je%20souhaite%20des%20informations%20sur%20Kasbi%20POS"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-zinc-300 hover:text-white font-mono"
              >
                +212 687-597267 ↗
              </a>
              <p className="text-[11px] text-zinc-500">Casablanca & Rabat, Maroc</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-zinc-900 pt-8 text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} Kasbi POS. Tous droits réservés. Conçu avec excellence pour les commerçants du Maroc.</p>
          <div className="flex items-center gap-6 mt-4 sm:mt-0 font-medium">
            <Link href="/privacy" className="hover:text-zinc-300 transition">Confidentialité</Link>
            <Link href="/terms" className="hover:text-zinc-300 transition">Conditions d'Utilisation</Link>
            <Link href="/admin" className="hover:text-zinc-300 transition">Portail Super Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
