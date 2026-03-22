// Custom type declaration for direct lucide-react icon imports
declare module 'lucide-react/dist/esm/icons/*' {
  import { LucideProps } from 'lucide-react';
  import { ForwardRefExoticComponent, RefAttributes } from 'react';
  const icon: ForwardRefExoticComponent<LucideProps & RefAttributes<SVGSVGElement>>;
  export default icon;
}
