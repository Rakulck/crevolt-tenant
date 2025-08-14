import { Suspense } from "react"

import { RentRollParserPage } from "./rent-roll-parser-page"
import { SectionLoading } from "@/components/loading/section-loading"

export default function RentRollParser() {
  return (
    <Suspense fallback={<SectionLoading message="Loading rent roll parser..." />}>
      <RentRollParserPage />
    </Suspense>
  )
}
