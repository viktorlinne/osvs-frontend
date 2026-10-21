import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AsyncState,
  Button,
  ConfirmDialog,
  GroupForm,
  GroupMailingSection,
  NotFoundPanel,
  PageContainer,
  UserSelection,
  errorTextClass,
} from "../components";
import { useError } from "../context";
import useDebouncedUserSearch from "../hooks/useDebouncedUserSearch";
import useFetch from "../hooks/useFetch";
import {
  addGroupMembers,
  deleteGroup,
  getGroup,
  listGroupMembers,
  removeGroupMember,
  updateGroup,
} from "../services/groups";
import type { Group, GroupInput, GroupMember } from "../types";
import { getApiErrorMessage, getApiFieldErrors } from "../utils/apiErrors";

function formatMemberCount(count: number) {
  return count === 1 ? "1 medlem" : `${count} medlemmar`;
}

function memberDisplayName(member: GroupMember) {
  const fullName = `${member.firstname} ${member.lastname}`.trim();
  return fullName || `#${member.matrikelnummer}`;
}

function formatAddResult(added: number, alreadyMembers: number) {
  const parts: string[] = [];
  if (added > 0) {
    parts.push(added === 1 ? "1 medlem lades till." : `${added} medlemmar lades till.`);
  }
  if (alreadyMembers > 0) {
    parts.push(
      alreadyMembers === 1
        ? "1 var redan medlem."
        : `${alreadyMembers} var redan medlemmar.`,
    );
  }
  return parts.join(" ");
}

export const GroupDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setError: setGlobalError, clearError: clearGlobalError } = useError();

  const {
    run: runGroup,
    data: group,
    setData: setGroup,
    loading: groupLoading,
    notFound: groupNotFound,
  } = useFetch<Group>();
  const [groupError, setGroupError] = useState(false);

  const {
    run: runMembers,
    data: members,
    loading: membersLoading,
  } = useFetch<GroupMember[]>();
  const [membersError, setMembersError] = useState(false);

  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addResult, setAddResult] = useState<string | null>(null);

  const [confirmRemoveId, setConfirmRemoveId] = useState<number | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const userSearch = useDebouncedUserSearch();

  const loadGroup = useCallback(() => {
    if (!id) return;
    setGroupError(false);
    runGroup(() => getGroup(id)).catch((error: unknown) => {
      const status = (error as { status?: number } | null)?.status;
      if (status !== 404) setGroupError(true);
    });
  }, [id, runGroup]);

  const loadMembers = useCallback((): Promise<GroupMember[] | null> => {
    if (!id) return Promise.resolve(null);
    setMembersError(false);
    return runMembers(() => listGroupMembers(id)).catch(() => {
      setMembersError(true);
      return null;
    });
  }, [id, runMembers]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadGroup();
      void loadMembers();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadGroup, loadMembers]);

  const memberIds = useMemo(
    () => new Set((members ?? []).map((member) => member.matrikelnummer)),
    [members],
  );
  const confirmRemoveMember =
    confirmRemoveId === null
      ? null
      : (members ?? []).find((member) => member.matrikelnummer === confirmRemoveId) ?? null;
  const candidateUsers = useMemo(
    () => userSearch.users.filter((user) => !memberIds.has(user.matrikelnummer)),
    [userSearch.users, memberIds],
  );

  function syncMemberCount(nextMembers: GroupMember[] | null) {
    if (!nextMembers) return;
    setGroup((prev) =>
      prev
        ? {
            ...prev,
            memberCount: nextMembers.length,
            userIds: nextMembers.map((member) => member.matrikelnummer),
          }
        : prev,
    );
  }

  async function handleUpdate(values: GroupInput) {
    if (!id) return;
    const updated = await updateGroup(id, values);
    setGroup(updated);
    setEditing(false);
    toast.success("Gruppen sparades.");
  }

  async function handleDelete() {
    if (!id) return;
    clearGlobalError();
    setDeleting(true);
    try {
      await deleteGroup(id);
      toast.success(group ? `Gruppen ${group.name} togs bort.` : "Gruppen togs bort.");
      navigate("/admin/groups");
    } catch (error: unknown) {
      setConfirmDelete(false);
      setGlobalError(getApiErrorMessage(error) ?? "Kunde inte ta bort gruppen");
    } finally {
      setDeleting(false);
    }
  }

  async function handleAddMembers() {
    if (!id || selectedUserIds.length === 0) return;
    clearGlobalError();
    setAddError(null);
    setAddResult(null);
    setAdding(true);
    try {
      const result = await addGroupMembers(
        id,
        selectedUserIds.map((value) => Number(value)),
      );
      setSelectedUserIds([]);
      setAddResult(formatAddResult(result.added.length, result.alreadyMembers.length));
      syncMemberCount(await loadMembers());
    } catch (error: unknown) {
      const fieldError = getApiFieldErrors(error)?.userIds;
      if (fieldError) setAddError(fieldError);
      else setGlobalError(getApiErrorMessage(error) ?? "Kunde inte lägga till medlemmar");
    } finally {
      setAdding(false);
    }
  }

  async function handleRemoveMember(matrikelnummer: number) {
    if (!id) return;
    clearGlobalError();
    setRemovingId(matrikelnummer);
    try {
      await removeGroupMember(id, matrikelnummer);
      const removed = (members ?? []).find((m) => m.matrikelnummer === matrikelnummer);
      toast.success(
        removed
          ? `${memberDisplayName(removed)} togs bort ur gruppen.`
          : "Medlemmen togs bort ur gruppen.",
      );
      setConfirmRemoveId(null);
      setAddResult(null);
      syncMemberCount(await loadMembers());
    } catch (error: unknown) {
      // Close the dialog so the global error banner is visible.
      setConfirmRemoveId(null);
      setGlobalError(getApiErrorMessage(error) ?? "Kunde inte ta bort medlemmen");
    } finally {
      setRemovingId(null);
    }
  }

  if (groupNotFound) {
    return (
      <PageContainer size="lg" className="ui-page">
        <NotFoundPanel
          title="Gruppen hittades inte"
          description="Gruppen kan ha tagits bort."
          backTo="/admin/groups"
          backLabel="Till grupper"
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer size="lg" className="ui-page">
      <Link to="/admin/groups" className="ui-link">
        ← Tillbaka till grupper
      </Link>

      <AsyncState
        loading={groupLoading && !group}
        error={groupError}
        errorMessage="Gruppen kunde inte laddas."
        onRetry={loadGroup}
        loadingFallback={
          <div className="mt-4" aria-busy="true" aria-label="Laddar grupp">
            <div className="h-8 w-1/2 rounded skeleton-shimmer" aria-hidden="true" />
            <div className="mt-3 h-4 w-2/3 rounded skeleton-shimmer" aria-hidden="true" />
          </div>
        }
      >
        {group ? (
          <section className="mt-4 mb-8" aria-labelledby="group-heading">
            {editing ? (
              <>
                <h1 id="group-heading" className="ui-page-title mb-4">
                  Redigera grupp
                </h1>
                <GroupForm
                  idPrefix="edit-group"
                  initialValues={group}
                  submitLabel="Spara"
                  submittingLabel="Sparar…"
                  fallbackErrorMessage="Kunde inte spara gruppen"
                  onSubmit={handleUpdate}
                  onCancel={() => setEditing(false)}
                />
              </>
            ) : (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h1 id="group-heading" className="ui-page-title break-words">
                    {group.name}
                  </h1>
                  {group.description ? (
                    <p className="mt-2 whitespace-pre-line text-neutral-700">
                      {group.description}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-neutral-500">Ingen beskrivning.</p>
                  )}
                  <p className="ui-chapter mt-3">{formatMemberCount(group.memberCount)}</p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Button type="button" variant="secondary" onClick={() => setEditing(true)}>
                    Redigera
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => setConfirmDelete(true)}
                  >
                    Ta bort
                  </Button>
                  <ConfirmDialog
                    open={confirmDelete}
                    onOpenChange={setConfirmDelete}
                    title={`Ta bort gruppen ${group.name}?`}
                    description={
                      group.memberCount > 0
                        ? `${group.memberCount} medlemskap tas bort, men medlemmarnas konton påverkas inte.`
                        : "Gruppen tas bort permanent."
                    }
                    confirmLabel="Ta bort"
                    pendingLabel="Tar bort…"
                    pending={deleting}
                    onConfirm={() => void handleDelete()}
                  />
                </div>
              </div>
            )}
          </section>
        ) : null}
      </AsyncState>

      {group ? (
        <>
          <section className="mb-8" aria-labelledby="members-heading">
            <h2 id="members-heading" className="mb-3 text-lg font-semibold text-neutral-900">
              Medlemmar
            </h2>
            <AsyncState
              loading={membersLoading && !members}
              error={membersError}
              errorMessage="Medlemmarna kunde inte laddas."
              onRetry={() => void loadMembers()}
              empty={(members ?? []).length === 0}
              emptyMessage={
                <p className="rounded-card border border-neutral-200 px-5 py-4 text-sm text-neutral-600">
                  Gruppen har inga medlemmar ännu.
                </p>
              }
              loadingFallback={
                <div
                  className="overflow-hidden rounded-card border border-neutral-200"
                  aria-busy="true"
                  aria-label="Laddar medlemmar"
                >
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="border-b border-neutral-200 px-5 py-3.5 last:border-b-0"
                      aria-hidden="true"
                    >
                      <div className="h-5 w-1/2 rounded skeleton-shimmer" />
                    </div>
                  ))}
                </div>
              }
            >
              <ul className="overflow-hidden rounded-card border border-neutral-200">
                {(members ?? []).map((member) => {
                  const fullName = `${member.firstname} ${member.lastname}`.trim();
                  return (
                    <li
                      key={member.matrikelnummer}
                      className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 bg-white px-5 py-3 last:border-b-0"
                    >
                      <div className="min-w-0">
                        <Link
                          to={`/members/${member.matrikelnummer}`}
                          className="font-semibold text-neutral-900 hover:underline"
                        >
                          {fullName || `#${member.matrikelnummer}`}
                        </Link>
                        <span className="ml-2 text-sm text-neutral-500">
                          #{member.matrikelnummer}
                        </span>
                        {member.archive ? (
                          <span className="ui-chapter ml-2">{member.archive}</span>
                        ) : null}
                        {member.email ? (
                          <span className="block truncate text-sm text-neutral-600">
                            {member.email}
                          </span>
                        ) : null}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={removingId !== null}
                        onClick={() => setConfirmRemoveId(member.matrikelnummer)}
                        aria-label={`Ta bort ${fullName || member.matrikelnummer} ur gruppen`}
                      >
                        Ta bort
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </AsyncState>
            <ConfirmDialog
              open={confirmRemoveMember !== null}
              onOpenChange={(open) => {
                if (!open) setConfirmRemoveId(null);
              }}
              title="Ta bort ur gruppen?"
              description={
                confirmRemoveMember
                  ? `${memberDisplayName(confirmRemoveMember)} tas bort ur gruppen ${group.name}. Medlemmens konto påverkas inte.`
                  : undefined
              }
              confirmLabel="Ta bort"
              pendingLabel="Tar bort…"
              pending={removingId !== null}
              onConfirm={() => {
                if (confirmRemoveMember) void handleRemoveMember(confirmRemoveMember.matrikelnummer);
              }}
            />
          </section>

          <section className="mb-8" aria-labelledby="add-members-heading">
            <h2 id="add-members-heading" className="mb-3 text-lg font-semibold text-neutral-900">
              Lägg till medlemmar
            </h2>
            <div className="ui-card">
              {userSearch.fetchError ? (
                <AsyncState
                  loading={false}
                  error
                  errorMessage="Medlemsregistret kunde inte laddas."
                  onRetry={() => void userSearch.reload().catch(() => undefined)}
                />
              ) : (
                <UserSelection
                  users={candidateUsers}
                  selectedIds={selectedUserIds}
                  onChange={(ids) => {
                    setAddError(null);
                    setSelectedUserIds(ids);
                  }}
                  label="Välj medlemmar att lägga till"
                  name="group-add-users"
                  emptyLabel={
                    userSearch.query.trim()
                      ? "Inga medlemmar matchade sökningen"
                      : "Inga fler medlemmar att lägga till"
                  }
                  loading={userSearch.loading}
                  disabled={adding}
                  searchQuery={userSearch.query}
                  onSearchQueryChange={userSearch.setQuery}
                />
              )}
              {addError ? <p className={errorTextClass}>{addError}</p> : null}
              {addResult ? (
                <p className="mb-3 text-sm text-neutral-700" role="status">
                  {addResult}
                </p>
              ) : null}
              <Button
                type="button"
                onClick={handleAddMembers}
                loading={adding}
                disabled={selectedUserIds.length === 0}
              >
                {adding
                  ? "Lägger till…"
                  : selectedUserIds.length > 0
                    ? `Lägg till (${selectedUserIds.length})`
                    : "Lägg till"}
              </Button>
            </div>
          </section>

          {id ? (
            <GroupMailingSection groupId={id} membersVersion={group.memberCount} />
          ) : null}
        </>
      ) : null}
    </PageContainer>
  );
};
