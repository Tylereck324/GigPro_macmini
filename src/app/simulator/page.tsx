import { Metadata } from 'next';
import { SimulatorContent } from './SimulatorContent';

export const metadata: Metadata = {
  title: 'Earnings Simulator | GigPro',
  description: 'Forecast weekly Amazon Flex earnings and optimize block combinations',
};

export default function SimulatorPage() {
  return <SimulatorContent />;
}
