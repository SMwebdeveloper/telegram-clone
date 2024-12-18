"use client";
import { Loader2 } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import ContactLists from "./_components/contact-lists";
import { useCurrentContact } from "@/hooks/use-current";
import { useRouter } from "next/navigation";
import AddContact from "./_components/add-contact";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { emailSchema, messageSchema } from "@/lib/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import TopChat from "./_components/top-chat";
import Chat from "./_components/chat";
import { useLoading } from "@/hooks/use-loading";
import { useSession } from "next-auth/react";
import { generateToken } from "@/lib/generate-token";
import { axiosClient } from "@/http/axios";
import { IUser } from "@/index";
import { toast } from "@/hooks/use-toast";
import { IError } from "@/types";
import { io } from "socket.io-client";
import { useAuth } from "@/hooks/use-auth";

const Page = () => {
  const [contacts, setContacts] = useState<IUser[]>([]);
  const { setCreating, setLoading, isLoading } = useLoading();
  const { currentContact, setCurrentContact } = useCurrentContact();
  const { setOnlineUsers } = useAuth();

  const router = useRouter();
  const socket = useRef<ReturnType<typeof io> | null>(null);

  const { data: session } = useSession();

  const contactForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const messageForm = useForm<z.infer<typeof messageSchema>>({
    resolver: zodResolver(messageSchema),
    defaultValues: { message: "", image: "" },
  });

  const getContacts = async () => {
    setLoading(true);
    const token = await generateToken(session?.currentUser?._id);
    try {
      const { data } = await axiosClient.get<{ contacts: IUser[] }>(
        "/api/user/contacts",
        { headers: { Authorization: `Baeror ${token}` } }
      );
      setContacts(data?.contacts);
    } catch (error) {
      toast({ description: "Cannot fetch contacts", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    router.replace("/");
    socket.current = io("ws://localhost:5000");
  }, []);

  useEffect(() => {
    if (session?.currentUser?._id) {
      getContacts();
      socket.current?.emit("addOnlineUser", session.currentUser);
      socket.current?.on(
        "getOnlineUsers",
        (data: { socketId: string; user: IUser }[]) => {
          setOnlineUsers(data.map((item) => item.user));
        }
      );
    }
  }, [session?.currentUser]);

  useEffect(() => {
    if (session?.currentUser) {
      socket.current?.on("getCreateUser", (user) => {
        console.log("Created by user", user);
      });
    }
  }, [session?.currentUser, socket]);

  const onCreateContact = async (values: z.infer<typeof emailSchema>) => {
    setCreating(true);
    const token = await generateToken(session?.currentUser?._id);
    try {
      const { data } = await axiosClient.post("/api/user/contact", values, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setContacts((prev) => [...prev, data.contact]);
      socket.current?.emit("createContact", {
        currentUser: session?.currentUser,
        receiver: data.contact,
      });

      toast({ description: "Contact added successfully" });
    } catch (error: any) {
      if ((error as IError).response?.data?.message) {
        return toast({
          description: (error as IError).response?.data?.message,
          variant: "destructive",
        });
      }
      return toast({
        description: "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const onSendMessage = (values: z.infer<typeof messageSchema>) => {
    console.log(values);
  };
  return (
    <>
      {/* Sidebar */}
      <div className="w-80 h-screen border-r fixed inset-0 z-50 ">
        {/* Loader */}
        {isLoading && (
          <div className="w-full h-[95vh] flex justify-center items-center">
            <Loader2 size={50} className="animate-spin" />
          </div>
        )}
        {/* Contact lists */}
        {!isLoading && <ContactLists contacts={contacts} />}{" "}
      </div>

      {/* Chat area */}
      <div className="pl-80 w-full">
        {!currentContact?._id && (
          <AddContact
            contactForm={contactForm}
            onCreateContact={onCreateContact}
          />
        )}
        {currentContact?._id && (
          <div className="w-full relative">
            <TopChat />
            {/* Chat */}
            <Chat messageForm={messageForm} onSendMessage={onSendMessage} />
          </div>
        )}
      </div>
    </>
  );
};

export default Page;
