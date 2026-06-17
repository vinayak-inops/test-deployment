import dynamic from 'next/dynamic';

const LeavePolicyPage = dynamic(() => import("./_componrnts/leave-policy-page"), {
  ssr: false,
  loading: () => <div>Loading...</div>
});

export default function Home() {
  return (
    <div className="w-full flex justify-center pb-2">
      <div className="w-full px-12">
        <LeavePolicyPage />
      </div>
    </div>
  );
}