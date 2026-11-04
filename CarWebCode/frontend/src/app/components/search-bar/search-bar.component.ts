import { Component, input, output, signal } from '@angular/core';

/** Search input with a submit button. Emits the trimmed term; empty searches are ignored. */
@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.css',
})
export class SearchBarComponent {
  readonly placeholder = input('Search by brand or model');
  // Not named `search`: <input type="search"> fires a native `search` event that would bubble to the host.
  readonly searchSubmit = output<string>();

  protected readonly query = signal('');

  submit(event: Event) {
    event.preventDefault();
    const term = this.query().trim();
    if (term) this.searchSubmit.emit(term);
  }
}
