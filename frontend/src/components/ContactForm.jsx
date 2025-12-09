import React, { useState } from "react";
import axios from "../api/axios"; // Make sure this path is correct

const ContactForm = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/contact", form);
      alert("Message sent!");
      setForm({ name: "", email: "", message: "" });
    } catch (error) {
      alert("Failed to send message.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md w-full flex flex-col gap-4 mt-6 pb-8 mx-auto"
    >
      <label className="text-2xl font-bold mb-2">Contact Us</label>
      <input
        type="text"
        name="name"
        placeholder="Name"
        value={form.name}
        onChange={handleChange}
        className="border border-black rounded px-4 py-2"
        required
      />
      <input
        type="email"
        name="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
        className="border border-black rounded px-4 py-2"
        required
      />
      <textarea
        name="message"
        placeholder="Message"
        value={form.message}
        onChange={handleChange}
        className="border border-black rounded px-4 py-2 min-h-[80px]"
        required
      />
      <button
        type="submit"
        className="bg-[#16166B] text-white font-bold px-8 py-2 rounded-lg mt-2"
      >
        Send
      </button>
    </form>
  );
};

export default ContactForm;