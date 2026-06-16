-- SRCHR RLS Advisor performance cleanup.
-- Keeps the existing access model, but rewrites policies to avoid per-row
-- auth.uid() evaluation and duplicate permissive SELECT policies.

-- Favorites.
drop policy if exists "Users can manage own favorites" on public.favorites;
create policy "Users can manage own favorites"
  on public.favorites
  for all
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Event participation.
drop policy if exists "Participants can read own participation" on public.event_participants;
create policy "Participants can read own participation"
  on public.event_participants for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Participants can upsert own participation" on public.event_participants;
create policy "Participants can upsert own participation"
  on public.event_participants for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "Participants can update own participation" on public.event_participants;
create policy "Participants can update own participation"
  on public.event_participants for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Participants can delete own participation" on public.event_participants;
create policy "Participants can delete own participation"
  on public.event_participants for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- Notifications.
drop policy if exists "Users can read own notifications" on public.notifications;
create policy "Users can read own notifications"
  on public.notifications for select
  to authenticated
  using (recipient_id = (select auth.uid()));

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
  on public.notifications for update
  to authenticated
  using (recipient_id = (select auth.uid()))
  with check (recipient_id = (select auth.uid()));

drop policy if exists "Users can read own notification preferences" on public.notification_preferences;
create policy "Users can read own notification preferences"
  on public.notification_preferences for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users can insert own notification preferences" on public.notification_preferences;
create policy "Users can insert own notification preferences"
  on public.notification_preferences for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "Users can update own notification preferences" on public.notification_preferences;
create policy "Users can update own notification preferences"
  on public.notification_preferences for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Users can delete own notification preferences" on public.notification_preferences;
create policy "Users can delete own notification preferences"
  on public.notification_preferences for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- Analytics.
drop policy if exists "Owners can read analytics events" on public.analytics_events;
create policy "Owners can read analytics events"
  on public.analytics_events for select
  to authenticated
  using (
    private.can_view_analytics(owner_type, owner_id)
    or actor_user_id = (select auth.uid())
  );

drop policy if exists "Users can read own survey answers" on public.market_survey_answers;
create policy "Users can read own survey answers"
  on public.market_survey_answers for select
  to authenticated
  using (user_id = (select auth.uid()) or private.analytics_is_admin());

drop policy if exists "Users can insert own survey answers" on public.market_survey_answers;
create policy "Users can insert own survey answers"
  on public.market_survey_answers for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "Users can update own survey answers" on public.market_survey_answers;
create policy "Users can update own survey answers"
  on public.market_survey_answers for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Organization relationships: split ALL policies so SELECT is not duplicated.
drop policy if exists "Owners manage organization memberships" on public.organization_members;
drop policy if exists "Owners insert organization memberships" on public.organization_members;
create policy "Owners insert organization memberships"
  on public.organization_members for insert to authenticated
  with check (
    private.is_org_member(organization_id, array['owner', 'admin'])
    or (
      user_id = (select auth.uid())
      and role in ('owner', 'admin')
      and exists (
        select 1 from public.organizations o
        where o.id = organization_id
          and o.created_by = (select auth.uid())
      )
    )
  );

drop policy if exists "Owners update organization memberships" on public.organization_members;
create policy "Owners update organization memberships"
  on public.organization_members for update to authenticated
  using (private.is_org_member(organization_id, array['owner', 'admin']))
  with check (private.is_org_member(organization_id, array['owner', 'admin']));

drop policy if exists "Owners delete organization memberships" on public.organization_members;
create policy "Owners delete organization memberships"
  on public.organization_members for delete to authenticated
  using (private.is_org_member(organization_id, array['owner', 'admin']));

drop policy if exists "Organization editors manage contractor profiles" on public.contractor_profiles;
drop policy if exists "Organization editors insert contractor profiles" on public.contractor_profiles;
create policy "Organization editors insert contractor profiles"
  on public.contractor_profiles for insert to authenticated
  with check (private.is_org_member(organization_id, array['owner', 'admin', 'editor']));

drop policy if exists "Organization editors update contractor profiles" on public.contractor_profiles;
create policy "Organization editors update contractor profiles"
  on public.contractor_profiles for update to authenticated
  using (private.is_org_member(organization_id, array['owner', 'admin', 'editor']))
  with check (private.is_org_member(organization_id, array['owner', 'admin', 'editor']));

drop policy if exists "Organization editors delete contractor profiles" on public.contractor_profiles;
create policy "Organization editors delete contractor profiles"
  on public.contractor_profiles for delete to authenticated
  using (private.is_org_member(organization_id, array['owner', 'admin', 'editor']));

drop policy if exists "Organization editors manage services" on public.organization_services;
drop policy if exists "Organization editors insert services" on public.organization_services;
create policy "Organization editors insert services"
  on public.organization_services for insert to authenticated
  with check (private.is_org_member(organization_id, array['owner', 'admin', 'editor']));

drop policy if exists "Organization editors update services" on public.organization_services;
create policy "Organization editors update services"
  on public.organization_services for update to authenticated
  using (private.is_org_member(organization_id, array['owner', 'admin', 'editor']))
  with check (private.is_org_member(organization_id, array['owner', 'admin', 'editor']));

drop policy if exists "Organization editors delete services" on public.organization_services;
create policy "Organization editors delete services"
  on public.organization_services for delete to authenticated
  using (private.is_org_member(organization_id, array['owner', 'admin', 'editor']));

-- Material expert authors: split ALL policy so SELECT is not duplicated.
drop policy if exists "Material owners manage expert authors" on public.material_expert_authors;
drop policy if exists "Material owners insert expert authors" on public.material_expert_authors;
create policy "Material owners insert expert authors"
  on public.material_expert_authors for insert to authenticated
  with check (
    exists (
      select 1 from public.materials m
      where m.id = material_id
        and (
          m.created_by = (select auth.uid())
          or private.is_org_member(
            coalesce(m.organization_id, m.company_id),
            array['owner', 'admin', 'editor']
          )
        )
    )
  );

drop policy if exists "Material owners update expert authors" on public.material_expert_authors;
create policy "Material owners update expert authors"
  on public.material_expert_authors for update to authenticated
  using (
    exists (
      select 1 from public.materials m
      where m.id = material_id
        and (
          m.created_by = (select auth.uid())
          or private.is_org_member(
            coalesce(m.organization_id, m.company_id),
            array['owner', 'admin', 'editor']
          )
        )
    )
  )
  with check (
    exists (
      select 1 from public.materials m
      where m.id = material_id
        and (
          m.created_by = (select auth.uid())
          or private.is_org_member(
            coalesce(m.organization_id, m.company_id),
            array['owner', 'admin', 'editor']
          )
        )
    )
  );

drop policy if exists "Material owners delete expert authors" on public.material_expert_authors;
create policy "Material owners delete expert authors"
  on public.material_expert_authors for delete to authenticated
  using (
    exists (
      select 1 from public.materials m
      where m.id = material_id
        and (
          m.created_by = (select auth.uid())
          or private.is_org_member(
            coalesce(m.organization_id, m.company_id),
            array['owner', 'admin', 'editor']
          )
        )
    )
  );

-- Price requests: one SELECT policy instead of two permissive SELECT policies.
drop policy if exists "Active price requests are visible to authenticated users" on public.price_requests;
drop policy if exists "Owners can read price requests" on public.price_requests;
drop policy if exists "Price requests are readable" on public.price_requests;
create policy "Price requests are readable"
  on public.price_requests for select
  to authenticated
  using (
    status = 'active'
    or created_by = (select auth.uid())
    or (
      organization_id is not null
      and exists (
        select 1
        from public.organization_members om
        where om.organization_id = price_requests.organization_id
          and om.user_id = (select auth.uid())
          and coalesce(om.role, 'member') in ('owner', 'admin', 'editor')
      )
    )
  );

-- Reviews: one SELECT policy and split answer management to avoid duplicate SELECT.
drop policy if exists "Published reviews are public" on public.reviews;
drop policy if exists "Reviewers can read own reviews" on public.reviews;
drop policy if exists "Reviews are readable" on public.reviews;
create policy "Reviews are readable"
  on public.reviews for select
  using (
    status = 'published'
    or (
      reviewer_id = (select auth.uid())
      or private.can_manage_reputation_target(target_type, target_id)
    )
  );

drop policy if exists "Users can create reviews" on public.reviews;
create policy "Users can create reviews"
  on public.reviews for insert
  to authenticated
  with check (
    reviewer_id = (select auth.uid())
    and status = 'moderation'
    and private.reputation_target_exists(target_type, target_id)
    and not private.can_manage_reputation_target(target_type, target_id)
  );

drop policy if exists "Reviewers can update pending reviews" on public.reviews;
create policy "Reviewers can update pending reviews"
  on public.reviews for update
  to authenticated
  using (reviewer_id = (select auth.uid()) and status = 'moderation')
  with check (reviewer_id = (select auth.uid()) and status = 'moderation');

drop policy if exists "Review participants can read answers" on public.review_answers;
create policy "Review participants can read answers"
  on public.review_answers for select
  to authenticated
  using (
    exists (
      select 1
      from public.reviews r
      where r.id = review_answers.review_id
        and (
          r.reviewer_id = (select auth.uid())
          or private.can_manage_reputation_target(r.target_type, r.target_id)
        )
    )
  );

drop policy if exists "Reviewers can manage pending answers" on public.review_answers;
drop policy if exists "Reviewers can insert pending answers" on public.review_answers;
create policy "Reviewers can insert pending answers"
  on public.review_answers for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.reviews r
      where r.id = review_answers.review_id
        and r.reviewer_id = (select auth.uid())
        and r.status = 'moderation'
    )
  );

drop policy if exists "Reviewers can update pending answers" on public.review_answers;
create policy "Reviewers can update pending answers"
  on public.review_answers for update
  to authenticated
  using (
    exists (
      select 1
      from public.reviews r
      where r.id = review_answers.review_id
        and r.reviewer_id = (select auth.uid())
        and r.status = 'moderation'
    )
  )
  with check (
    exists (
      select 1
      from public.reviews r
      where r.id = review_answers.review_id
        and r.reviewer_id = (select auth.uid())
        and r.status = 'moderation'
    )
  );

drop policy if exists "Reviewers can delete pending answers" on public.review_answers;
create policy "Reviewers can delete pending answers"
  on public.review_answers for delete
  to authenticated
  using (
    exists (
      select 1
      from public.reviews r
      where r.id = review_answers.review_id
        and r.reviewer_id = (select auth.uid())
        and r.status = 'moderation'
    )
  );

notify pgrst, 'reload schema';
