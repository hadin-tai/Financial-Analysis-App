import uploadData from "../assets/home/upload-data.svg?url";
import automatedAnalysis from "../assets/home/automated-analysis.svg?url";
import visualInsights from "../assets/home/visual-insights.svg?url";
import actionableDecisions from "../assets/home/actionable-decisions.svg?url";

export default function HowItWorks() {
  const steps = [
    {
      img: uploadData,
      title: "Upload Your Data",
      desc: "Import CSV, Excel, or JSON in seconds."
    },
    {
      img: automatedAnalysis,
      title: "Automated Analysis",
      desc: "Our AI crunches the numbers instantly."
    },
    {
      img: visualInsights,
      title: "Visual Insights",
      desc: "See beautiful charts and KPIs."
    },
    {
      img: actionableDecisions,
      title: "Actionable Decisions",
      desc: "Make informed moves with confidence."
    }
  ];

  return (
    <section className="py-12 text-center">
      {/* Heading stays the same */}
      <h2 className="text-4xl font-bold mb-6 text-gray-900 leading-tight">
        How it Works ?
      </h2>

      {/* Steps */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-20 max-w-6xl mx-auto mt-10">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center space-y-10">
            <img
              src={step.img}
              alt={step.title}
              className="mx-auto h-60 w-auto"
            />
            <div className="space-y-3 text-center">
              <h3 className="text-xl font-semibold">{step.title}</h3>
              <p className="text-lg text-gray-600">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
