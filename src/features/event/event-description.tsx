interface EventDescriptionProps {
  description: string;
}

export function EventDescription({ description }: EventDescriptionProps) {
  return (
    <div className="mb-6 py-8 text-left md:mb-10 md:py-12 md:text-center">
      <p className="whitespace-pre-wrap text-base leading-8 text-black md:text-lg md:leading-loose">
        {description}
      </p>
    </div>
  );
}
