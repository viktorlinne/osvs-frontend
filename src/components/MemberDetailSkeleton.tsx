import {
  SkeletonCircle,
  SkeletonFieldRow,
  SkeletonLabel,
  SkeletonText,
} from "./PageSkeleton";

export const MemberDetailSkeleton = () => (
  <div className="flex flex-col gap-4">
    {/* Header card — mirrors AchievementsPanel */}
    <div className="ui-card">
      <div className="flex w-full flex-col items-center gap-2 pb-2">
        <SkeletonCircle className="mb-3 h-28 w-28 md:h-36 md:w-36" />
        <SkeletonText width="w-44" />
        <div className="mt-4 flex flex-col items-center gap-2">
          <SkeletonLabel width="w-12" />
          <SkeletonText width="w-36" />
        </div>
        <div className="mt-4 flex w-full max-w-xs flex-col items-center gap-2">
          <SkeletonLabel width="w-28" />
          <SkeletonText width="w-48" />
          <SkeletonText width="w-40" />
        </div>
      </div>
    </div>

    {/* Two-column body — mirrors ProfileForm | RolesManager+Officials+Allergies */}
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="ui-card flex flex-col gap-5">
        <SkeletonText width="w-36" />
        <SkeletonFieldRow cols={2} />
        <SkeletonFieldRow cols={2} />
        <SkeletonFieldRow cols={2} />
        <SkeletonFieldRow cols={3} />
        <SkeletonFieldRow cols={1} />
        <SkeletonFieldRow cols={1} />
      </div>
      <div className="ui-card flex flex-col gap-5">
        <SkeletonText width="w-24" />
        <div className="flex flex-col gap-2">
          <SkeletonLabel width="w-16" />
          <SkeletonText width="w-40" />
          <SkeletonText width="w-32" />
        </div>
        <div className="flex flex-col gap-2">
          <SkeletonLabel width="w-24" />
          <SkeletonText width="w-48" />
          <SkeletonText width="w-36" />
        </div>
        <div className="flex flex-col gap-2">
          <SkeletonLabel width="w-20" />
          <SkeletonText width="w-44" />
        </div>
      </div>
    </div>
  </div>
);
