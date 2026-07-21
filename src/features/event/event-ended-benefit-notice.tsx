interface EventEndedBenefitNoticeProps {
  title: string;
  description: string;
}

export function EventEndedBenefitNotice({
  title,
  description,
}: EventEndedBenefitNoticeProps) {
  return (
    <section className="mt-8 rounded-sm bg-white shadow-sm md:mt-10">
      <div className="rounded-t-sm border-b border-gray-200 p-5 text-center md:p-8">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-black uppercase">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed md:mt-4 md:text-base">
          {description}
        </p>
      </div>
    </section>
  );
}
