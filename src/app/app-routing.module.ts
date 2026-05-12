import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { ArticleComponent } from './pages/article/article.component';
import { AboutComponent } from './pages/about/about.component';
import { ArticleDetailComponent } from './pages/article-detail/article-detail.component';
import { NavComponent } from './pages/nav/nav.component';
import { ToolsComponent } from './pages/tools/tools.component';
import { PdfConverterComponent } from './pages/pdf-converter/pdf-converter.component';
import { PdfMergerComponent } from './pages/pdf-merger/pdf-merger.component';
import { IpInfoComponent } from './pages/ip-info/ip-info.component';
import { TimestampComponent } from './pages/timestamp/timestamp.component';
import { HashCalcComponent } from './pages/hash-calc/hash-calc.component';
import { MdToPdfComponent } from './pages/md-to-pdf/md-to-pdf.component';
import { ResumeComponent } from './pages/resume/resume.component';
import { ResumeDetailComponent } from './pages/resume-detail/resume-detail.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'resume', component: ResumeComponent },
  { path: 'resume/:id', component: ResumeDetailComponent },
  { path: 'article', component: ArticleComponent },
  { path: 'article/:id', component: ArticleDetailComponent },
  { path: 'about', component: AboutComponent },
  { path: 'nav', component: NavComponent },
  { path: 'tools', component: ToolsComponent },
  { path: 'pdf-converter', component: PdfConverterComponent },
  { path: 'pdf-merger', component: PdfMergerComponent },
  { path: 'ip-info', component: IpInfoComponent },
  { path: 'timestamp', component: TimestampComponent },
  { path: 'hash-calc', component: HashCalcComponent },
  { path: 'md-to-pdf', component: MdToPdfComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
