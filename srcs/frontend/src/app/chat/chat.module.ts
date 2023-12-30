import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialogModule } from '@angular/material/dialog'
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { ChatComponent } from './chat.component';
import { ChannelCardComponent } from './channel-card/channel-card.component';
import { ChannelComponent } from './channel/channel.component';
import { ChannelCreatorComponent } from './channel-creator/channel-creator.component';
import { MessageComponent } from './message/message.component';
import { UserThumbnailComponent } from '../user/user-thumbnail/user-thumbnail.component';
import { SearchComponent } from '../utils/search/search.component';
import { SearchbarComponent } from '../utils/search/searchbar/searchbar.component';
import { MatTooltipModule } from '@angular/material/tooltip';

@NgModule({
  declarations: [ChatComponent, ChannelCardComponent, ChannelComponent, ChannelCreatorComponent, MessageComponent, SearchComponent, SearchbarComponent, UserThumbnailComponent],
  imports: [CommonModule, FormsModule, MatTooltipModule, MatMenuModule, MatIconModule, MatExpansionModule, MatTabsModule, MatDialogModule, MatSlideToggleModule, MatSidenavModule],
  exports: [ChatComponent, SearchComponent, SearchbarComponent, ChannelCardComponent, ChannelComponent, UserThumbnailComponent]
})
export class ChatModule {}
