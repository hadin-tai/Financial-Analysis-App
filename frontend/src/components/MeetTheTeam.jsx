import React from "react";
import profileIcon from "../assets/aboutus/profileicon.svg?url";

const team = [
  {
    role: "Team Leader",
    name: "Hadin Tai",
    desc: "Backend Developer"
  },
  {
    role: "Team Member",
    name: "Swayam Chauhan",
    desc: "Backend Developer"
  },
  {
    role: "Team Member",
    name: "Dev Mewadia",
    desc: "Frontend Developer"
  },
  {
    role: "Team Member",
    name: "Rahil Mirchiwala",
    desc: "Frontend Developer"
  }
];

export default function MeetTheTeam() {
  return (
    <section className="py-12 text-center">
      <h2 className="text-4xl font-bold mb-6 text-gray-900 leading-tight">
        Meet Our Team
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-20 max-w-6xl mx-auto mt-10">
        {team.map((member, index) => (
          <div key={index} className="flex flex-col items-center space-y-2">
            <div className="font-bold">{member.role}</div>
            <img
              src={profileIcon}
              alt={member.name}
              className="mx-auto h-40 w-40 rounded-full bg-gray-200 object-cover"
            />
            <div className="space-y-1 text-center mt-2">
              <div className="font-semibold text-lg">{member.name}</div>
              <div className="text-gray-600">{member.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
