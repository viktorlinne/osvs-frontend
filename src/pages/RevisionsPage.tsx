import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  PageContainer,
  inputClass,
  labelClass,
  selectClass,
} from "../components";
import { useAuth } from "../context";
import useFetch from "../hooks/useFetch";
import { listLodges, listRevisions } from "../services";
import type { Lodge, Revision } from "../types";

export const RevisionsPage = () => {
  const { user } = useAuth();
  const canCreate = Boolean(
    user && (user.roles ?? []).some((r) => ["Admin", "Editor"].includes(r)),
  );

  const { data: revisions, run, loading } = useFetch<Revision[]>();
  const { run: runLodges, data: lodges } = useFetch<Lodge[]>();

  const [yearFilter, setYearFilter] = useState("");
  const [selectedLodge, setSelectedLodge] = useState("");

  useEffect(() => {
    runLodges(async () => {
      const data = await listLodges();
      return Array.isArray(data) ? data : [];
    }).catch(() => {
      // handled by useFetch
    });
  }, [runLodges]);

  useEffect(() => {
    const parsedYear =
      yearFilter.trim().length > 0 ? Number(yearFilter.trim()) : undefined;
    const parsedLodgeId =
      selectedLodge.trim().length > 0
        ? Number(selectedLodge.trim())
        : undefined;

    if (
      parsedYear !== undefined &&
      (!Number.isInteger(parsedYear) || parsedYear < 1900 || parsedYear > 3000)
    ) {
      return;
    }
    if (
      parsedLodgeId !== undefined &&
      (!Number.isInteger(parsedLodgeId) || parsedLodgeId <= 0)
    ) {
      return;
    }

    run(() =>
      listRevisions({
        year: parsedYear,
        lodgeId: parsedLodgeId,
      }),
    ).catch(() => {
      // handled by useFetch
    });
  }, [run, yearFilter, selectedLodge]);

  return (
    <PageContainer size="xl" className="ui-page">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="ui-page-title">Revisioner</h2>
        {canCreate && (
          <Link to="/revisions/create" className="ui-btn ui-btn-primary">
            Lägg till revision
          </Link>
        )}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2">
        <label htmlFor="revision-year-filter" className={labelClass}>
          Filtrera på år
          <input
            id="revision-year-filter"
            type="number"
            inputMode="numeric"
            min={1900}
            max={3000}
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            placeholder="ex. 2026"
            className={inputClass}
          />
        </label>

        <label htmlFor="revision-lodge-filter" className={labelClass}>
          Filtrera på loge
          <select
            id="revision-lodge-filter"
            value={selectedLodge}
            onChange={(e) => setSelectedLodge(e.target.value)}
            className={selectClass}
          >
            <option value="">Alla loger</option>
            {(lodges ?? []).map((lodge) => (
              <option key={lodge.id} value={String(lodge.id)}>
                {lodge.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid w-full gap-4">
        {(revisions ?? []).map((revision) => (
          <a
            key={revision.id}
            href={revision.pictureUrl ?? "#"}
            target="_blank"
            rel="noreferrer"
            className="ui-card ui-card-hover block"
          >
            <div className="text-lg font-semibold text-neutral-900">{revision.title}</div>
            <div className="text-sm text-neutral-600">
              {revision.lodgeName} - {revision.year}
            </div>
          </a>
        ))}
      </div>

      {!loading && (revisions ?? []).length === 0 && (
        <p className="mt-6 text-neutral-600">Inga revisioner hittades.</p>
      )}
    </PageContainer>
  );
};
