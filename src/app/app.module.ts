import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';

import { HomeComponent } from './pages/home/home.component';
import { ArticleComponent } from './pages/article/article.component';
import { ResumeComponent } from './pages/resume/resume.component';
import { AboutComponent } from './pages/about/about.component';
import { ArticleDetailComponent } from './pages/article-detail/article-detail.component';
import { ResumeDetailComponent } from './pages/resume-detail/resume-detail.component';
import { NavComponent } from './pages/nav/nav.component';
import { ToolsComponent } from './pages/tools/tools.component';
import { PdfConverterComponent } from './pages/pdf-converter/pdf-converter.component';
import { PdfMergerComponent } from './pages/pdf-merger/pdf-merger.component';
import { IpInfoComponent } from './pages/ip-info/ip-info.component';
import { TimestampComponent } from './pages/timestamp/timestamp.component';
import { HashCalcComponent } from './pages/hash-calc/hash-calc.component';
import { MdToPdfComponent } from './pages/md-to-pdf/md-to-pdf.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    ArticleComponent,
    ResumeComponent,
    AboutComponent,
    ArticleDetailComponent,
    ResumeDetailComponent,
    NavComponent,
    ToolsComponent,
    PdfConverterComponent,
    PdfMergerComponent,
    IpInfoComponent,
    TimestampComponent,
    HashCalcComponent,
    MdToPdfComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    AppRoutingModule,
    CoreModule,
    SharedModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
