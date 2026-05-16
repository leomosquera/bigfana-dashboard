"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  Search,
  Bell,
  ChevronDown,
  Zap,
  TrendingUp,
  Users,
  PanelLeft,
  User,
  Settings,
  Shield,
  LogOut,
  CreditCard,
} from "lucide-react";

import { Avatar } from "@/components/ui/Avatar";

const notifications = [
  {
    id: 1,
    icon: TrendingUp,
    text: "Revenue superó $2.8M este mes",
    time: "hace 5min",
    color: "text-[#00D4A8]",
  },
  {
    id: 2,
    icon: Users,
    text: "1,200 nuevos fans registrados hoy",
    time: "hace 22min",
    color: "text-blue-400",
  },
  {
    id: 3,
    icon: Zap,
    text: "Nike activó campaña Champions",
    time: "hace 1h",
    color: "text-[#FF2D55]",
  },
];

type ProfileKey = "myProfile" | "security" | "billing" | "settings";

const profileItems: {
  icon:  React.ComponentType<{ size?: number }>;
  tKey:  ProfileKey;
}[] = [
  { icon: User,       tKey: "myProfile" },
  { icon: Shield,     tKey: "security"  },
  { icon: CreditCard, tKey: "billing"   },
  { icon: Settings,   tKey: "settings"  },
];

interface HeaderProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Header({
  collapsed,
  onToggle,
}: HeaderProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const t = useTranslations("header");

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        notifRef.current &&
        !notifRef.current.contains(e.target as Node)
      ) {
        setNotifOpen(false);
      }

      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header
      className="
        sticky
        top-0
        z-30

        h-16

        border-b
        border-white/[0.06]

        bg-[#0D0D14]/80
        backdrop-blur-xl

        px-6

        flex
        items-center
        gap-4
      "
    >

      {/* LEFT */}
      <div className="flex items-center gap-3">

        {/* SIDEBAR TOGGLE */}
        <button
          onClick={onToggle}
          className="
            flex
            items-center
            justify-center

            w-10
            h-10

            rounded-xl

            border
            border-white/[0.06]

            bg-white/[0.03]

            text-[#8888AA]

            hover:text-[#F0F0F8]
            hover:border-white/[0.12]
            hover:bg-white/[0.05]

            transition-all
            duration-200
          "
        >

          <PanelLeft
            size={18}
            className={`
              transition-transform duration-300
              ${collapsed ? "rotate-180" : ""}
            `}
          />

        </button>

        {/* SEARCH */}
        <div className="flex-1 min-w-[280px] max-w-md">

          <div
            className={`
              flex
              items-center
              gap-3

              h-10
              px-3

              rounded-xl

              border

              transition-all
              duration-200

              ${
                searchFocused
                  ? "border-[#FF2D55]/40 bg-[#141420]"
                  : "border-white/[0.06] bg-white/[0.03]"
              }
            `}
          >

            <Search
              size={14}
              className="text-[#55556A] shrink-0"
            />

            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              className="
                flex-1

                bg-transparent

                text-sm
                text-[#F0F0F8]

                placeholder:text-[#55556A]

                outline-none
              "
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />

            <kbd
              className="
                hidden
                sm:flex

                items-center
                gap-1

                px-1.5
                py-0.5

                rounded

                border
                border-white/[0.06]

                bg-white/[0.04]

                text-[10px]
                font-medium
                text-[#55556A]
              "
            >
              ⌘K
            </kbd>

          </div>

        </div>

      </div>

      {/* RIGHT */}
      <div className="ml-auto flex items-center gap-2">

        {/* LIVE */}
        <div
          className="
            hidden
            md:flex

            items-center
            gap-2

            px-3
            py-1.5

            rounded-full

            border
            border-[#00D4A8]/20

            bg-[#00D4A8]/10
          "
        >

          <span className="
            w-1.5
            h-1.5

            rounded-full

            bg-[#00D4A8]

            animate-pulse
          " />

          <span className="
            text-xs
            font-semibold
            text-[#00D4A8]
          ">
            Live
          </span>

        </div>

        {/* NOTIFICATIONS */}
        <div
          ref={notifRef}
          className="relative"
        >

          <button
            onClick={() => {
              setNotifOpen((v) => !v);
              setProfileOpen(false);
            }}
            className="
              relative

              w-10
              h-10

              rounded-xl

              flex
              items-center
              justify-center

              border
              border-white/[0.06]

              bg-white/[0.03]

              text-[#8888AA]

              hover:text-[#F0F0F8]
              hover:border-white/[0.12]
              hover:bg-white/[0.05]

              transition-all
            "
          >

            <Bell size={15} />

            <span className="
              absolute
              top-2
              right-2

              w-1.5
              h-1.5

              rounded-full

              bg-[#FF2D55]
            " />

          </button>

          <AnimatePresence>

            {notifOpen && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 8,
                  scale: 0.96,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  y: 8,
                  scale: 0.96,
                }}
                transition={{
                  duration: 0.15,
                }}
                className="
                  absolute
                  right-0
                  top-12

                  w-80

                  overflow-hidden

                  rounded-2xl

                  border
                  border-white/[0.08]

                  bg-[#141420]

                  shadow-[0_20px_80px_rgba(0,0,0,0.45)]

                  z-50
                "
              >

                {/* HEADER */}
                <div className="
                  px-4
                  py-3

                  border-b
                  border-white/[0.06]

                  flex
                  items-center
                  justify-between
                ">

                  <p className="
                    text-sm
                    font-semibold
                    text-[#F0F0F8]
                  ">
                    {t("notifications.title")}
                  </p>

                  <span className="
                    text-xs
                    font-medium
                    text-[#FF2D55]
                  ">
                    3 nuevas
                  </span>

                </div>

                {/* ITEMS */}
                <div className="divide-y divide-white/[0.04]">

                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="
                        flex
                        items-start
                        gap-3

                        px-4
                        py-3

                        hover:bg-white/[0.03]

                        transition-colors
                        cursor-pointer
                      "
                    >

                      <div className={`mt-0.5 shrink-0 ${n.color}`}>
                        <n.icon size={14} />
                      </div>

                      <div className="flex-1 min-w-0">

                        <p className="
                          text-xs
                          leading-snug
                          text-[#F0F0F8]
                        ">
                          {n.text}
                        </p>

                        <p className="
                          mt-0.5

                          text-[10px]
                          text-[#55556A]
                        ">
                          {n.time}
                        </p>

                      </div>

                    </div>
                  ))}

                </div>

                {/* FOOTER */}
                <div className="
                  px-4
                  py-2.5

                  border-t
                  border-white/[0.06]
                ">

                  <button
                    className="
                      text-xs
                      font-medium

                      text-[#FF2D55]

                      hover:text-[#FF6B6B]

                      transition-colors
                    "
                  >
                    {t("notifications.viewAll")}
                  </button>

                </div>

              </motion.div>
            )}

          </AnimatePresence>

        </div>

        {/* PROFILE */}
        <div
          ref={profileRef}
          className="relative"
        >

          <button
            onClick={() => {
              setProfileOpen((v) => !v);
              setNotifOpen(false);
            }}
            className="
              flex
              items-center
              gap-2

              px-2
              py-1.5

              rounded-xl

              hover:bg-white/[0.04]

              transition-colors
              cursor-pointer
            "
          >

            <Avatar
              initials="RC"
              size="sm"
              color="brand"
            />

            <div className="hidden md:block text-left">

              <p className="
                text-xs
                font-semibold
                text-[#F0F0F8]
              ">
                River Club
              </p>

              <p className="
                text-[10px]
                text-[#55556A]
              ">
                Admin
              </p>

            </div>

            <ChevronDown
              size={12}
              className={`
                text-[#55556A]
                transition-transform
                duration-200

                ${profileOpen ? "rotate-180" : ""}
              `}
            />

          </button>

          <AnimatePresence>

            {profileOpen && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 8,
                  scale: 0.96,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  y: 8,
                  scale: 0.96,
                }}
                transition={{
                  duration: 0.15,
                }}
                className="
                  absolute
                  right-0
                  top-12

                  w-64

                  overflow-hidden

                  rounded-2xl

                  border
                  border-white/[0.08]

                  bg-[#141420]

                  shadow-[0_20px_80px_rgba(0,0,0,0.45)]

                  z-50
                "
              >

                {/* TOP */}
                <div className="
                  p-4

                  border-b
                  border-white/[0.06]
                ">

                  <div className="flex items-center gap-3">

                    <Avatar
                      initials="RC"
                      size="md"
                      color="brand"
                    />

                    <div>

                      <p className="
                        text-sm
                        font-semibold
                        text-[#F0F0F8]
                      ">
                        River Club
                      </p>

                      <p className="
                        text-xs
                        text-[#55556A]
                      ">
                        admin@riverclub.com
                      </p>

                    </div>

                  </div>

                </div>

                {/* MENU */}
                <div className="p-2">

                  {profileItems.map((item) => (
                    <button
                      key={item.tKey}
                      className="
                        w-full

                        flex
                        items-center
                        gap-3

                        px-3
                        py-2.5

                        rounded-xl

                        text-left

                        text-[#8888AA]

                        hover:text-[#F0F0F8]
                        hover:bg-white/[0.04]

                        transition-all
                      "
                    >

                      <item.icon size={15} />

                      <span className="text-sm font-medium">
                        {t(`profile.${item.tKey}`)}
                      </span>

                    </button>
                  ))}

                </div>

                {/* LOGOUT */}
                <div className="
                  p-2

                  border-t
                  border-white/[0.06]
                ">

                    <button
                      onClick={() => {
                        window.location.href = "/";
                      }}
                      className="
                        w-full

                        flex
                        items-center
                        gap-3

                        px-3
                        py-2.5

                        rounded-xl

                        text-left

                        text-red-400

                        hover:bg-red-500/10

                        transition-all
                      "
                    >

                    <LogOut size={15} />

                    <span className="text-sm font-medium">
                      {t("profile.logout")}
                    </span>

                  </button>

                </div>

              </motion.div>
            )}

          </AnimatePresence>

        </div>

      </div>

    </header>
  );
}