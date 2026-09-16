alter table public.public_letters
  drop constraint if exists public_letters_body_check;

alter table public.public_letters
  add constraint public_letters_body_check
  check (char_length(body) between 1 and 150);
