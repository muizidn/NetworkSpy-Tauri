import { ArrowDown2, ArrowRight2 } from "iconsax-react";
import { useState } from "react";

type Props = {
  text: string;
  children: React.ReactNode;
};

const Expand = (props: Props) => {
  const [isOpen, setIsOpen] = useState(false);

  const onToggle = () => setIsOpen(!isOpen);

  return (
    <div className='my-2 text-white' onClick={onToggle}>
      <div className='flex items-center cursor-pointer text-white mb-2'>
        {!isOpen ? (
          <ArrowRight2 size='15' color='#fff' className='mr-2' />
        ) : (
          <ArrowDown2 size='15' color='#fff' className='mr-2' />
        )}
        {props.text}
      </div>
      {isOpen ? <div className='ml-6'>{props.children}</div> : null}
    </div>
  );
};

export default Expand;
